import prisma from '@/_lib/prisma';

let firebaseAdmin: any = null;
let messagingInstance: any = null;
let circuitOpen = false;
let consecutiveFailures = 0;
let circuitOpenedAt = 0;

const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RECOVERY_MS = 60_000;
const DEDUP_WINDOW_MS = 60_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 3000];
const MAX_PAYLOAD_BYTES = 4096;

/** Recent push keys for dedup (in-memory, per-instance). */
const recentPushes = new Map<string, number>();

/**
 * Lazily initializes Firebase Admin SDK.
 * Returns null if credentials are not configured.
 */
async function getMessaging() {
  if (messagingInstance) return messagingInstance;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn('[push-service] FIREBASE_SERVICE_ACCOUNT_JSON not set, push disabled');
    return null;
  }

  if (!firebaseAdmin) {
    const moduleName = 'firebase-admin';
    firebaseAdmin = await (import(/* webpackIgnore: true */ moduleName) as Promise<any>);
    if (firebaseAdmin.apps.length === 0) {
      const credential = JSON.parse(
        Buffer.from(serviceAccountJson, 'base64').toString('utf-8')
      );
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(credential),
      });
    }
  }

  messagingInstance = firebaseAdmin.messaging();
  return messagingInstance;
}

/**
 * Checks whether the circuit breaker is open.
 * Auto-recovers after CIRCUIT_RECOVERY_MS.
 */
function isCircuitOpen(): boolean {
  if (!circuitOpen) return false;
  if (Date.now() - circuitOpenedAt > CIRCUIT_RECOVERY_MS) {
    circuitOpen = false;
    consecutiveFailures = 0;
    console.log('[push-service] Circuit breaker recovered');
    return false;
  }
  return true;
}

function recordSuccess() {
  consecutiveFailures = 0;
}

function recordFailure() {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_THRESHOLD) {
    circuitOpen = true;
    circuitOpenedAt = Date.now();
    console.error('[push-service] Circuit breaker OPEN — disabling push for 60s');
  }
}

/**
 * Deduplicates push sends within a time window.
 * Returns true if this push should be skipped.
 */
function isDuplicate(userId: string, type: string, featureId: string): boolean {
  const key = `${userId}:${type}:${featureId}`;
  const lastSent = recentPushes.get(key);
  if (lastSent && Date.now() - lastSent < DEDUP_WINDOW_MS) return true;
  recentPushes.set(key, Date.now());

  // Cleanup old entries periodically
  if (recentPushes.size > 1000) {
    const now = Date.now();
    for (const [k, v] of recentPushes) {
      if (now - v > DEDUP_WINDOW_MS) recentPushes.delete(k);
    }
  }
  return false;
}

/**
 * Truncates notification body to fit within FCM payload limits.
 */
function truncateBody(body: string): string {
  const encoded = new TextEncoder().encode(body);
  if (encoded.length <= MAX_PAYLOAD_BYTES - 512) return body;
  // Leave room for title + data fields (~512 bytes overhead)
  const maxBodyBytes = MAX_PAYLOAD_BYTES - 512;
  const decoder = new TextDecoder();
  return decoder.decode(encoded.slice(0, maxBodyBytes - 3)) + '...';
}

/**
 * Sleeps for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gets all active device tokens for a user.
 */
async function getActiveTokens(userId: string): Promise<string[]> {
  const devices = await prisma.deviceToken.findMany({
    where: { userId, active: true },
    select: { token: true },
  });
  return devices.map((d) => d.token);
}

/**
 * Marks stale tokens as inactive in the database.
 */
async function deactivateTokens(tokens: string[]) {
  if (tokens.length === 0) return;
  await prisma.deviceToken.updateMany({
    where: { token: { in: tokens } },
    data: { active: false },
  });
}

/**
 * Sends a push notification to a single user's devices.
 * Fire-and-forget: never throws, logs errors internally.
 *
 * @param userId - Target user's ID.
 * @param title - Notification title.
 * @param body - Notification body text.
 * @param data - Optional data payload for routing.
 * @returns Count of sent vs failed tokens.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  try {
    if (isCircuitOpen()) return { sent: 0, failed: 0 };

    const type = data?.type ?? '';
    const featureId = data?.featureId ?? '';
    if (type && isDuplicate(userId, type, featureId)) {
      return { sent: 0, failed: 0 };
    }

    const messaging = await getMessaging();
    if (!messaging) return { sent: 0, failed: 0 };

    const tokens = await getActiveTokens(userId);
    if (tokens.length === 0) return { sent: 0, failed: 0 };

    return await sendToTokens(messaging, tokens, title, body, data);
  } catch (error) {
    console.error('[push-service] sendPushToUser error:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Sends a push notification to multiple users.
 * Batches tokens across all users and sends in chunks of 500.
 *
 * @param userIds - Array of target user IDs.
 * @param title - Notification title.
 * @param body - Notification body text.
 * @param data - Optional data payload for routing.
 * @returns Aggregate count of sent vs failed tokens.
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  try {
    if (isCircuitOpen()) return { sent: 0, failed: 0 };

    const messaging = await getMessaging();
    if (!messaging) return { sent: 0, failed: 0 };

    const devices = await prisma.deviceToken.findMany({
      where: { userId: { in: userIds }, active: true },
      select: { token: true },
    });
    const tokens = devices.map((d) => d.token);
    if (tokens.length === 0) return { sent: 0, failed: 0 };

    return await sendToTokens(messaging, tokens, title, body, data);
  } catch (error) {
    console.error('[push-service] sendPushToUsers error:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Sends a test push notification to a user's devices.
 *
 * @param userId - The user to send the test notification to.
 * @returns Count of sent vs failed.
 */
export async function sendTestPush(
  userId: string
): Promise<{ sent: number; failed: number }> {
  return sendPushToUser(
    userId,
    '🔔 LuvVerse Test',
    'Push notifications are working! You will receive alerts for budgets, reminders, and more.',
    { type: 'TEST', featureId: '', notificationId: '' }
  );
}

/**
 * Diagnostic test-push variant. Bypasses the dedup window so users can repeat
 * tests, and returns rich diagnostics (device count, fcm config status,
 * circuit-breaker state) so the UI can show a precise failure reason.
 */
export async function sendTestPushDiagnostic(userId: string): Promise<{
  sent: number;
  failed: number;
  deviceCount: number;
  fcmConfigured: boolean;
  circuitOpen: boolean;
  reason: string;
}> {
  const tokens = await getActiveTokens(userId);
  const deviceCount = tokens.length;

  if (deviceCount === 0) {
    return {
      sent: 0,
      failed: 0,
      deviceCount: 0,
      fcmConfigured: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      circuitOpen: false,
      reason: 'NO_DEVICES',
    };
  }

  if (isCircuitOpen()) {
    return {
      sent: 0,
      failed: 0,
      deviceCount,
      fcmConfigured: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      circuitOpen: true,
      reason: 'CIRCUIT_OPEN',
    };
  }

  const messaging = await getMessaging();
  if (!messaging) {
    return {
      sent: 0,
      failed: 0,
      deviceCount,
      fcmConfigured: false,
      circuitOpen: false,
      reason: 'FCM_NOT_CONFIGURED',
    };
  }

  try {
    const { sent, failed } = await sendToTokens(
      messaging,
      tokens,
      '🔔 LuvVerse Test',
      'Push notifications are working! You will receive alerts for budgets, reminders, and more.',
      { type: 'TEST', featureId: '', notificationId: '' }
    );
    let reason: string;
    if (sent > 0 && failed === 0) reason = 'OK';
    else if (sent > 0) reason = 'PARTIAL';
    else reason = 'ALL_FAILED';
    return {
      sent,
      failed,
      deviceCount,
      fcmConfigured: true,
      circuitOpen: false,
      reason,
    };
  } catch (err) {
    console.error('[push-service] sendTestPushDiagnostic error:', err);
    return {
      sent: 0,
      failed: deviceCount,
      deviceCount,
      fcmConfigured: true,
      circuitOpen: false,
      reason: 'EXCEPTION',
    };
  }
}

/**
 * Core send logic: batches tokens in groups of 500, handles stale token cleanup
 * and retries with exponential backoff.
 */
async function sendToTokens(
  messaging: any, // firebase-admin Messaging instance
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  const truncatedBody = truncateBody(body);
  let totalSent = 0;
  let totalFailed = 0;
  const staleTokens: string[] = [];

  // Batch in groups of 500 (FCM limit)
  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);

    const message = {
      notification: { title, body: truncatedBody },
      data: data ?? {},
      tokens: batch,
    };

    let response: any = null; // firebase-admin BatchResponse

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await messaging.sendEachForMulticast(message);
        recordSuccess();
        break;
      } catch (error: unknown) {
        const isRetryable = isRetryableError(error);
        if (!isRetryable || attempt === MAX_RETRIES) {
          recordFailure();
          console.error(`[push-service] Batch send failed after ${attempt + 1} attempts:`, error);
          totalFailed += batch.length;
          break;
        }
        await sleep(RETRY_DELAYS[attempt]);
      }
    }

    if (response) {
      totalSent += response.successCount;
      totalFailed += response.failureCount;

      // Identify stale tokens
      response.responses.forEach((resp: any, idx: number) => {
        if (resp.error) {
          const code = resp.error.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            staleTokens.push(batch[idx]);
          }
        }
      });
    }
  }

  // Cleanup stale tokens asynchronously
  if (staleTokens.length > 0) {
    deactivateTokens(staleTokens).catch((err) =>
      console.error('[push-service] Failed to deactivate stale tokens:', err)
    );
  }

  return { sent: totalSent, failed: totalFailed };
}

/**
 * Checks if an FCM error is retryable (429 rate limit or 5xx server error).
 */
function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    return code === 'messaging/server-unavailable' ||
      code === 'messaging/internal-error';
  }
  return false;
}
