const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60_000;

/**
 * Check whether the given user is within the schedule-scan rate budget.
 *
 * Allows up to 10 scans per rolling 60-second window per user (in-memory,
 * per-instance).
 *
 * @param userId - The authenticated user id requesting a scan.
 * @returns `true` if the request is allowed, `false` if rate-limited.
 */
export function checkScheduleScanRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}
