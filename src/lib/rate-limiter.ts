import { LRUCache } from "lru-cache";
import { NextResponse } from "next/server";

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: (limit: number, token: string): Promise<void> =>
      new Promise((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited
          ? reject(new Error("Rate limit exceeded"))
          : resolve();
      }),

    getRemainingRequests: (limit: number, token: string): number => {
      const tokenCount = tokenCache.get(token) || [0];
      return Math.max(0, limit - tokenCount[0]);
    },

    reset: (token: string): void => {
      tokenCache.delete(token);
    },
  };
}

// Pre-configured limiters for different use cases
export const loginLimiter = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 15 * 60 * 1000, // 15 minutes
});

export const apiLimiter = rateLimit({
  uniqueTokenPerInterval: 1000,
  interval: 60 * 1000, // 1 minute
});

// Stricter limiter for sensitive operations
export const sensitiveOperationLimiter = rateLimit({
  uniqueTokenPerInterval: 100,
  interval: 60 * 60 * 1000, // 1 hour
});

// Public endpoint limiter (for unauthenticated requests)
export const publicEndpointLimiter = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 60 * 1000, // 1 minute
});

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip"); // Cloudflare

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return "unknown";
}

/**
 * Rate limit check helper that returns proper response
 * @param limiter - The rate limiter to use
 * @param limit - Max requests allowed
 * @param token - Unique identifier (usually IP or user ID)
 * @param message - Custom error message
 * @returns null if allowed, NextResponse if rate limited
 */
export async function checkRateLimit(
  limiter: ReturnType<typeof rateLimit>,
  limit: number,
  token: string,
  message = "Terlalu banyak permintaan. Coba lagi nanti."
): Promise<NextResponse | null> {
  try {
    await limiter.check(limit, token);
    return null;
  } catch {
    return NextResponse.json(
      { error: message },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }
}

/**
 * Safe parseInt with validation
 * Returns defaultValue if parsing fails or result is NaN
 */
export function safeParseInt(
  value: string | null,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) return defaultValue;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;

  return parsed;
}
