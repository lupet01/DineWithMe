import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RateLimitConfig, RateLimitPresets } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth";

type RouteHandler = (
  request: NextRequest,
  ...args: unknown[]
) => Promise<NextResponse> | NextResponse;

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // In production, only allow the app URL
  if (process.env.NODE_ENV === "production" && appUrl) {
    return [appUrl];
  }

  // In development, allow localhost variants
  return [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    appUrl,
  ].filter(Boolean) as string[];
}

/**
 * Check if origin is allowed
 */
function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Allow requests without origin (same-origin)
  
  const allowedOrigins = getAllowedOrigins();
  
  // In development, allow all origins
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return allowedOrigins.includes(origin);
}

/**
 * CORS middleware with environment-aware origin restrictions
 */
export function withCors(handler: RouteHandler) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const origin = request.headers.get("origin");
    const allowedOrigin = isOriginAllowed(origin) ? (origin || "*") : (getAllowedOrigins()[0] ?? "*");

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400", // 24 hours
      };
      
      if (allowedOrigin) {
        headers["Access-Control-Allow-Origin"] = allowedOrigin;
      }

      return new NextResponse(null, {
        status: 200,
        headers,
      });
    }

    const response = await handler(request, ...args);

    // Add CORS headers to response
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    return response;
  };
}

/**
 * Rate limiting middleware
 * 
 * @param config - Rate limit configuration (defaults to STANDARD preset)
 */
export function withRateLimit(
  handler: RouteHandler,
  config: RateLimitConfig = RateLimitPresets.STANDARD
) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const result = checkRateLimit(request, config);

    // Add rate limit headers to all responses
    const headers = {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.reset.toString(),
    };

    // If rate limit exceeded, return 429
    if (!result.success) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            message: "Too many requests. Please try again later.",
            code: "RATE_LIMIT_EXCEEDED",
            retryAfter: result.reset,
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": (result.reset - Math.floor(Date.now() / 1000)).toString(),
            ...headers,
          },
        }
      );
    }

    // Continue with request and add rate limit headers
    const response = await handler(request, ...args);
    
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Authentication middleware
 * Requires valid authentication before proceeding
 */
export function withAuth(handler: RouteHandler) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const authResult = await requireAuth(request);

    if ("error" in authResult) {
      return authResult.error;
    }

    // Pass user to handler via request context
    // Handler can access via requireAuth() again (will use cache)
    return handler(request, ...args);
  };
}
