import { Redis } from "@upstash/redis";

// Upstash Redis client — gracefully degrades when env vars are missing.
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel/env.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

export default redis;

// ─── Cache Helpers ───────────────────────────────────────────

/**
 * Get a value from Redis cache. Returns null if Redis is not configured
 * or the key doesn't exist.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

/**
 * Set a value in Redis cache with a TTL in seconds.
 * No-op if Redis is not configured.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Silently fail — cache is best-effort
  }
}

/**
 * Delete one or more keys from Redis cache.
 * No-op if Redis is not configured.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(...keys);
  } catch {
    // Silently fail
  }
}

/**
 * Delete all keys matching a glob pattern (e.g., "finance:dashboard:*").
 * No-op if Redis is not configured.
 */
export async function cacheInvalidatePattern(
  pattern: string,
): Promise<void> {
  if (!redis) return;
  try {
    let cursor = "0";
    do {
      const result = await redis.scan(Number(cursor), {
        match: pattern,
        count: 100,
      });
      cursor = String(result[0]);
      const keys = result[1] as string[];
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    // Silently fail
  }
}
