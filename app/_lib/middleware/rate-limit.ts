import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import redis from '../redis';
import { auth } from '../auth';

/**
 * Configuration options for rate limiting.
 */
interface RateLimitConfig {
  /**
   * Maximum number of requests allowed within the time window.
   */
  max: number;
  /**
   * Time window in seconds for the rate limit.
   */
  window: number;
  /**
   * Optional prefix for the Redis key (default: 'default').
   */
  keyPrefix?: string;
  /**
   * Whether to apply rate limiting per authenticated user (default: true).
   */
  byUser?: boolean;
  /**
   * Whether to apply rate limiting per IP address (default: true).
   */
  byIP?: boolean;
}

/**
 * Rate limit check result.
 */
interface RateLimitResult {
  /**
   * Whether the rate limit has been exceeded.
   */
  exceeded: boolean;
  /**
   * Number of requests remaining in the current window.
   */
  remaining: number;
  /**
   * Maximum requests allowed.
   */
  limit: number;
  /**
   * Unix timestamp (seconds) when the rate limit resets.
   */
  reset: number;
}

/**
 * Extracts the client IP address from request headers.
 *
 * @param req - The Next.js request object.
 * @return The client IP address, or 'unknown' if not found.
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  return 'unknown';
}

/**
 * Checks rate limit for a given Redis key using sliding window algorithm.
 *
 * @param key - The Redis key to check.
 * @param max - Maximum number of requests allowed.
 * @param window - Time window in seconds.
 * @return Rate limit check result.
 */
async function checkRateLimit(
  key: string,
  max: number,
  window: number
): Promise<RateLimitResult> {
  // Gracefully degrade when Redis is not configured
  if (!redis) {
    return {
      exceeded: false,
      remaining: max,
      limit: max,
      reset: Math.floor(Date.now() / 1000) + window,
    };
  }
  try {
    // Increment the counter
    const count = await redis.incr(key);

    // If this is the first request, set expiration
    if (count === 1) {
      await redis.expire(key, window);
    }

    // Get TTL to calculate reset time
    const ttl = await redis.ttl(key);
    const reset = Math.floor(Date.now() / 1000) + (ttl > 0 ? ttl : window);

    return {
      exceeded: count > max,
      remaining: Math.max(0, max - count),
      limit: max,
      reset,
    };
  } catch (error) {
    // Silent fail on Redis errors - allow the request through
    console.error('Rate limit check failed:', error);
    return {
      exceeded: false,
      remaining: max,
      limit: max,
      reset: Math.floor(Date.now() / 1000) + window,
    };
  }
}

/**
 * Creates a rate-limited wrapper around an API handler using sliding window rate limiting.
 *
 * @param handler - The Next.js API route handler to wrap.
 * @param config - Rate limiting configuration.
 * @return A wrapped handler function with rate limiting applied.
 */
/**
 * Route handler type that supports both plain handlers and context-aware handlers
 * (e.g. dynamic [id] routes that receive params via context).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: NextRequest, context?: any) => Promise<NextResponse>;

export function withRateLimit(
  handler: RouteHandler,
  config: RateLimitConfig
): RouteHandler {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    // Check if rate limiting is disabled globally
    const enableRateLimit = process.env.ENABLE_RATE_LIMIT !== 'false';
    if (!enableRateLimit) {
      return handler(req, context);
    }

    // Apply rate limit multiplier
    const multiplier = parseFloat(process.env.RATE_LIMIT_MULTIPLIER || '1.0');
    const actualMax = Math.floor(config.max * multiplier);
    const keyPrefix = config.keyPrefix || 'default';
    const byUser = config.byUser !== false;
    const byIP = config.byIP !== false;

    const checks: Promise<RateLimitResult>[] = [];

    // Check per-user rate limit if enabled and user is authenticated
    if (byUser) {
      try {
        // For Bearer token requests (mobile), extract userId from JWT directly
        // to avoid the expensive auth() call that opens a DB connection.
        const authHeader = req.headers.get('authorization');
        let rateUserId: string | null = null;

        if (authHeader?.startsWith('Bearer ')) {
          try {
            const secret = process.env.NEXTAUTH_SECRET || 'fallback-dev-secret';
            const decoded = jwt.verify(authHeader.slice(7), secret) as { sub?: string; type?: string };
            if (decoded.sub && decoded.type !== 'refresh') {
              rateUserId = decoded.sub;
            }
          } catch {
            // Invalid JWT — skip user-based rate limiting, rely on IP
          }
        } else {
          const session = await auth();
          if (session?.user?.id) {
            rateUserId = session.user.id;
          }
        }

        if (rateUserId) {
          const userKey = `ratelimit:user:${keyPrefix}:${rateUserId}`;
          checks.push(checkRateLimit(userKey, actualMax, config.window));
        }
      } catch (error) {
        // Silent fail on auth errors
        console.error('Auth check failed in rate limit:', error);
      }
    }

    // Check per-IP rate limit if enabled
    if (byIP) {
      const ip = getClientIP(req);
      if (ip !== 'unknown') {
        const ipKey = `ratelimit:ip:${keyPrefix}:${ip}`;
        checks.push(checkRateLimit(ipKey, actualMax, config.window));
      }
    }

    // If no checks are configured, allow the request
    if (checks.length === 0) {
      return handler(req, context);
    }

    // Wait for all rate limit checks
    const results = await Promise.all(checks);

    // Find the most restrictive result (highest exceeded or lowest remaining)
    const limitingResult = results.reduce((prev, curr) => {
      if (curr.exceeded && !prev.exceeded) return curr;
      if (!curr.exceeded && prev.exceeded) return prev;
      return curr.remaining < prev.remaining ? curr : prev;
    });

    // If rate limit exceeded, return 429 response
    if (limitingResult.exceeded) {
      const retryAfter = limitingResult.reset - Math.floor(Date.now() / 1000);
      
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limitingResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitingResult.reset.toString(),
            'Retry-After': Math.max(1, retryAfter).toString(),
          },
        }
      );
    }

    // Add rate limit headers to the response
    const response = await handler(req, context);
    response.headers.set('X-RateLimit-Limit', limitingResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', limitingResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', limitingResult.reset.toString());

    return response;
  };
}
