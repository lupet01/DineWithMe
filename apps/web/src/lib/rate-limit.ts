import { NextRequest } from "next/server";

/**
 * Simple in-memory rate limiter for MVP
 * 
 * For production, consider using:
 * - Upstash Redis (@upstash/ratelimit)
 * - Vercel KV
 * - Redis with ioredis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (will reset on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;

  /**
   * Time window in seconds
   */
  windowSeconds: number;

  /**
   * Custom identifier function (defaults to IP address)
   */
  identifier?: (request: NextRequest) => string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return (forwardedFor.split(",")[0] ?? forwardedFor).trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP
  return request.ip || "unknown";
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const identifier = config.identifier
    ? config.identifier(request)
    : getClientIdentifier(request);

  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    limit: config.maxRequests,
    remaining,
    reset: Math.floor(entry.resetAt / 1000),
  };
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict: 10 requests per 10 seconds
   * Use for: Authentication endpoints, payment endpoints
   */
  STRICT: {
    maxRequests: 10,
    windowSeconds: 10,
  },

  /**
   * Standard: 60 requests per minute
   * Use for: Most API endpoints
   */
  STANDARD: {
    maxRequests: 60,
    windowSeconds: 60,
  },

  /**
   * Relaxed: 100 requests per minute
   * Use for: Read-only endpoints, public data
   */
  RELAXED: {
    maxRequests: 100,
    windowSeconds: 60,
  },

  /**
   * Very strict: 5 requests per minute
   * Use for: Admin operations, sensitive actions
   */
  VERY_STRICT: {
    maxRequests: 5,
    windowSeconds: 60,
  },
} as const;
