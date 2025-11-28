import { LRUCache } from "lru-cache";

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
  };
}

// Pre-configured limiters for different use cases
export const loginLimiter = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 15 * 60 * 1000, // 15 minutes
});

export const apiLimiter = rateLimit({
  uniqueTokenPerInterval: 500,
  interval: 60 * 1000, // 1 minute
});

// Helper to get client IP from request
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return "unknown";
}
