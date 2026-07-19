import { NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Rate limiter with an Upstash Redis backend when configured, falling back
 * to the original in-memory implementation otherwise.
 *
 * The in-memory version doesn't work correctly on Vercel's multi-instance
 * serverless model - each instance has its own memory, so a user hitting
 * different instances across requests effectively bypasses the limit. Kept
 * as the local-dev fallback (no Redis needed to run the app) and as a
 * safety net if Upstash is ever unreachable, rather than removed outright.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (fallback only - resets on server restart, and is not
// shared across serverless instances)
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

function checkRateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `ratelimit:${identifier}:${config.maxRequests}:${config.windowSeconds}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

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

// Lazily-created Redis client and one Ratelimit instance per distinct
// (maxRequests, windowSeconds) pair actually used - the presets below cover
// nearly all real usage, so this cache stays tiny.
let redis: Redis | null | undefined;
const upstashLimiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

function getUpstashLimiter(config: RateLimitConfig): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const cacheKey = `${config.maxRequests}:${config.windowSeconds}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowSeconds} s`),
      prefix: "dinewithme:ratelimit",
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Check if request is within rate limit. Uses Upstash Redis when
 * UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN are configured, otherwise
 * falls back to the in-memory implementation.
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const identifier = config.identifier
    ? config.identifier(request)
    : getClientIdentifier(request);

  const limiter = getUpstashLimiter(config);
  if (limiter) {
    try {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: Math.floor(result.reset / 1000),
      };
    } catch (error) {
      // Upstash unreachable - fail open to the in-memory limiter rather
      // than blocking every request in the outage.
      console.error("Upstash rate limit check failed, falling back to in-memory:", error);
    }
  }

  return checkRateLimitInMemory(identifier, config);
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
