interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const store = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 10_000;

function pruneExpired(now: number): void {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Checks and increments an in-memory fixed-window rate limit counter for a key.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    if (store.size >= MAX_STORE_SIZE) {
      pruneExpired(now);
    }
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1000),
  );

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds,
  };
}

export function resetRateLimitStore(): void {
  store.clear();
}
