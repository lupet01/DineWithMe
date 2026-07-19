import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { track, AnalyticsEvents } from "@dinewithme/analytics";
import { Role } from "@dinewithme/shared";
import { getAuthenticatedUser, hasRole, type AuthUser } from "./core";

/**
 * API error response format
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    requestId: string;
    timestamp: string;
  };
}

/**
 * Generate or extract request ID for correlation logging
 */
export function getRequestId(request?: NextRequest): string {
  if (request) {
    const existingId = request.headers.get("x-request-id");
    if (existingId) return existingId;
  }
  return randomUUID();
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  message: string,
  code: string,
  status: number,
  requestId: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
        requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

/**
 * Require authenticated user for API route
 * Returns user or error response
 */
export async function requireAuth(
  request?: NextRequest
): Promise<{ user: AuthUser } | { error: NextResponse<ApiErrorResponse> }> {
  const requestId = getRequestId(request);

  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      console.warn(`[Auth] Unauthenticated access attempt [${requestId}]`);

      // Emit analytics event
      await track(AnalyticsEvents.API_ACCESS_DENIED, {
        reason: "unauthenticated",
        requestId,
        timestamp: new Date().toISOString(),
      });

      return {
        error: createErrorResponse(
          "Authentication required",
          "UNAUTHENTICATED",
          401,
          requestId
        ),
      };
    }

    console.log(
      `[Auth] Authenticated user: ${user.email} (${user.role}) [${requestId}]`
    );

    // Emit analytics event
    await track(AnalyticsEvents.API_ACCESS_GRANTED, {
      userId: user.id,
      email: user.email,
      role: user.role,
      requestId,
      timestamp: new Date().toISOString(),
    });

    return { user };
  } catch (error) {
    console.error(`[Auth] Error in requireAuth [${requestId}]:`, error);

    return {
      error: createErrorResponse(
        "Authentication error",
        "AUTH_ERROR",
        500,
        requestId
      ),
    };
  }
}

/**
 * Require user to have one of the specified roles
 * Returns user or error response
 */
export async function requireRole(
  roles: Role[],
  request?: NextRequest
): Promise<{ user: AuthUser } | { error: NextResponse<ApiErrorResponse> }> {
  const requestId = getRequestId(request);

  // First check authentication
  const authResult = await requireAuth(request);

  if ("error" in authResult) {
    return authResult;
  }

  const { user } = authResult;

  // Check if user has required role
  if (!hasRole(user, roles)) {
    console.warn(
      `[Auth] Unauthorized access attempt by ${user.email} (${user.role}). Required: ${roles.join(", ")} [${requestId}]`
    );

    // Emit analytics event
    await track(AnalyticsEvents.API_ACCESS_DENIED, {
      userId: user.id,
      email: user.email,
      role: user.role,
      requiredRoles: roles,
      reason: "insufficient_permissions",
      requestId,
      timestamp: new Date().toISOString(),
    });

    return {
      error: createErrorResponse(
        `Access denied. Required role: ${roles.join(" or ")}`,
        "FORBIDDEN",
        403,
        requestId
      ),
    };
  }

  console.log(
    `[Auth] Authorized user: ${user.email} (${user.role}) [${requestId}]`
  );

  return { user };
}

/**
 * Helper to check if result is an error response
 */
export function isErrorResponse(
  result: { user: AuthUser } | { error: NextResponse<ApiErrorResponse> }
): result is { error: NextResponse<ApiErrorResponse> } {
  return "error" in result;
}
