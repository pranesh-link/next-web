import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '../redis';
import { auth } from '../auth';

/**
 * Configuration options for the cache middleware.
 */
export interface CacheConfig {
  /** Time-to-live for cached responses in seconds. */
  ttl: number;
  /** Prefix for the cache key. Defaults to 'api-cache'. */
  keyPrefix?: string;
  /** Whether to include user ID in cache key. Defaults to true. */
  varyByUser?: boolean;
  /** Whether to include query string in cache key. Defaults to true. */
  varyByQuery?: boolean;
}

/**
 * Higher-order function that wraps a Next.js API route handler with Redis caching.
 *
 * Automatically caches GET request responses in Redis with configurable TTL and key generation.
 * Respects ENABLE_API_CACHE and CACHE_DEBUG environment variables for global control.
 *
 * @param handler - The Next.js API route handler to wrap.
 * @param config - Cache configuration options.
 * @returns A wrapped handler that implements caching logic.
 *
 * @example
 * ```typescript
 * export const GET = withCache(
 *   async (req) => {
 *     const data = await fetchExpensiveData();
 *     return NextResponse.json(data);
 *   },
 *   { ttl: 300, keyPrefix: 'user-profile', varyByUser: true }
 * );
 * ```
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: CacheConfig
): (req: NextRequest) => Promise<NextResponse> {
  const {
    ttl,
    keyPrefix = 'api-cache',
    varyByUser = true,
    varyByQuery = true,
  } = config;

  return async (req: NextRequest): Promise<NextResponse> => {
    const cacheEnabled = process.env.ENABLE_API_CACHE !== 'false';
    const debugEnabled = process.env.CACHE_DEBUG === 'true';

    // Bypass cache if disabled globally
    if (!cacheEnabled) {
      if (debugEnabled) {
        console.log('[Cache] Disabled globally via ENABLE_API_CACHE=false');
      }
      const response = await handler(req);
      response.headers.set('X-Cache', 'DISABLED');
      return response;
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      if (debugEnabled) {
        console.log(`[Cache] Skipping cache for non-GET method: ${req.method}`);
      }
      return handler(req);
    }

    try {
      // Build cache key
      const url = new URL(req.url);
      const pathname = url.pathname;
      const queryString = varyByQuery ? url.search : '';

      let userId = '';
      if (varyByUser) {
        try {
          const session = await auth();
          userId = session?.user?.id || 'anonymous';
        } catch (error) {
          if (debugEnabled) {
            console.warn('[Cache] Failed to get session, using anonymous:', error);
          }
          userId = 'anonymous';
        }
      }

      const cacheKey = `${keyPrefix}:${userId}:${pathname}${queryString}`;

      if (debugEnabled) {
        console.log(`[Cache] Key: ${cacheKey}`);
      }

      // Try to get from cache
      try {
        const cachedData = await cacheGet<any>(cacheKey);
        if (cachedData !== null) {
          if (debugEnabled) {
            console.log(`[Cache] HIT: ${cacheKey}`);
          }
          const response = NextResponse.json(cachedData);
          response.headers.set('X-Cache', 'HIT');
          return response;
        }
      } catch (error) {
        if (debugEnabled) {
          console.warn('[Cache] Error reading from cache, continuing without cache:', error);
        }
      }

      // Cache miss - execute handler
      if (debugEnabled) {
        console.log(`[Cache] MISS: ${cacheKey}`);
      }

      const response = await handler(req);

      // Only cache successful responses (2xx status codes)
      if (response.ok && response.status >= 200 && response.status < 300) {
        try {
          // Clone response to read body without consuming original
          const clonedResponse = response.clone();
          const data = await clonedResponse.json();

          // Store in cache
          await cacheSet(cacheKey, data, ttl);

          if (debugEnabled) {
            console.log(`[Cache] Stored: ${cacheKey} (TTL: ${ttl}s)`);
          }
        } catch (error) {
          if (debugEnabled) {
            console.warn('[Cache] Error writing to cache, continuing without cache:', error);
          }
        }
      } else if (debugEnabled) {
        console.log(`[Cache] Skipping cache for non-2xx response: ${response.status}`);
      }

      response.headers.set('X-Cache', 'MISS');
      return response;
    } catch (error) {
      // Gracefully handle any unexpected errors - just execute handler without cache
      if (debugEnabled) {
        console.error('[Cache] Unexpected error in cache middleware, bypassing cache:', error);
      }
      return handler(req);
    }
  };
}
