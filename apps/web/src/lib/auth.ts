import { auth } from "@clerk/nextjs/server";
import { userRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Authenticated user with role information
 */
export interface ApiAuthUser {
  id: string;
  clerkId: string;
  email: string;
  role: Role;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
}

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
 * Get current authenticated user from database
 * Returns null if not authenticated or not found in database
 */
export async function getCurrentUser(): Promise<ApiAuthUser | null> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return null;
    }

    // Get user from database by Clerk ID
    const dbUser = await userRepository.findByAuthProviderId(userId);

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      clerkId: dbUser.authProviderId,
      email: dbUser.email,
      role: dbUser.role as Role,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      avatarUrl: dbUser.avatarUrl,
    };
  } catch (error) {
    console.error("[Auth] Error getting current user:", error);
    return null;
  }
}

/**
 * Require authenticated user for API route
 * Returns user or error response
 */
export async function requireAuth(
  request?: NextRequest
): Promise<{ user: ApiAuthUser } | { error: NextResponse<ApiErrorResponse> }> {
  const requestId = getRequestId(request);

  try {
    const user = await getCurrentUser();

    if (!user) {
      console.warn(`[Auth] Unauthenticated access attempt [${requestId}]`);

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
): Promise<{ user: ApiAuthUser } | { error: NextResponse<ApiErrorResponse> }> {
  const requestId = getRequestId(request);

  // First check authentication
  const authResult = await requireAuth(request);

  if ("error" in authResult) {
    return authResult;
  }

  const { user } = authResult;

  // Check if user has required role
  if (!roles.includes(user.role)) {
    console.warn(
      `[Auth] Unauthorized access attempt by ${user.email} (${user.role}). Required: ${roles.join(", ")} [${requestId}]`
    );

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
  result: { user: ApiAuthUser } | { error: NextResponse<ApiErrorResponse> }
): result is { error: NextResponse<ApiErrorResponse> } {
  return "error" in result;
}
