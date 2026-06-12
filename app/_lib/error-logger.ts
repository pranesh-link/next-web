import { db } from "@db";
import { appErrors } from "@db/schema";

/**
 * Fire-and-forget error logger. Writes a row to app_errors.
 * Never throws — always safe to call from middleware or catch blocks.
 */
export function logApiError({
  userId,
  route,
  method,
  statusCode,
  error,
  platform,
  appVersion,
}: {
  userId?: string | null;
  route: string;
  method: string;
  statusCode: number;
  error: unknown;
  platform?: string | null;
  appVersion?: string | null;
}): void {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : `HTTP ${statusCode}`;
  const stack = error instanceof Error ? (error.stack ?? null) : null;

  db.insert(appErrors)
    .values({
      userId: userId ?? null,
      route,
      method,
      statusCode,
      message,
      stack,
      platform: platform ?? null,
      appVersion: appVersion ?? null,
    })
    .catch(() => {
      // Silently swallow — error logging must never break the API
    });
}
