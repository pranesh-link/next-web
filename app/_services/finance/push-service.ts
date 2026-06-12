import { db } from '@db';
import { deviceTokens } from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';

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
    try {
      const moduleName = 'firebase-admin';
      const adminModule = await (import(/* webpackIgnore: true */ moduleName) as Promise<any>);
      // Handle both ESM (adminModule.default) and CJS (adminModule itself) exports
      firebaseAdmin = adminModule.default || adminModule;
      console.log('[push-service] firebase-admin module loaded', {
        hasDefault: !!adminModule.default,
        hasApps: !!firebaseAdmin?.apps,
        appsLength: firebaseAdmin?.apps?.length,
      });
      
      if (!firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
        const credential = JSON.parse(
          Buffer.from(serviceAccountJson, 'base64').toString('utf-8')
        );
        firebaseAdmin.initializeApp({
          credential: firebaseAdmin.credential.cert(credential),
        });
        console.log('[push-service] firebase-admin app initialized');
      } else {
        console.log('[push-service] firebase-admin app already initialized');
      }
    } catch (error) {
      console.error('[push-service] Failed to load/init firebase-admin:', error);
      firebaseAdmin = null;
      return null;
    }
  }

  try {
    if (!firebaseAdmin) {
      console.error('[push-service] firebaseAdmin is null, cannot get messaging');
      return null;
    }
    if (typeof firebaseAdmin.messaging !== 'function') {
      console.error('[push-service] firebaseAdmin.messaging is not a function', {
        type: typeof firebaseAdmin.messaging,
        keys: Object.keys(firebaseAdmin),
      });
      return null;
    }
    messagingInstance = firebaseAdmin.messaging();
    console.log('[push-service] messaging instance created');
    return messagingInstance;
  } catch (error) {
    console.error('[push-service] Failed to get messaging instance:', error);
    messagingInstance = null;
    return null;
  }
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
  const devices = await db.query.deviceTokens.findMany({
    where: and(eq(deviceTokens.userId, userId), eq(deviceTokens.active, true)),
    columns: { token: true },
  });
  return devices.map((d) => d.token);
}

/**
 * Marks stale tokens as inactive in the database.
 */
async function deactivateTokens(tokens: string[]) {
  if (tokens.length === 0) return;
  await db.update(deviceTokens).set({ active: false }).where(inArray(deviceTokens.token, tokens));
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
    // Skip dedup for chat messages — every message needs a push
    if (type && type !== 'CHAT_MESSAGE' && isDuplicate(userId, type, featureId)) {
      return { sent: 0, failed: 0 };
    }

    const messaging = await getMessaging();
    if (!messaging) return { sent: 0, failed: 0 };

    const tokens = await getActiveTokens(userId);
    if (tokens.length === 0) return { sent: 0, failed: 0 };

    const result = await sendToTokens(messaging, userId, tokens, title, body, data);
    // DB notification is created by the caller (notification generator)
    // to avoid duplicate entries. Push service only sends notifications.

    return result;
  } catch (error) {
    console.error('[push-service] sendPushToUser error:', error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Sends a silent (data-only) push to a user's devices.
 * Does NOT include a `notification` key, so the OS never shows a tray
 * notification. Intended for background triggers such as E2E key
 * bootstrap on COUPLE_FORMED.
 *
 * Android: woken via high-priority FCM data message.
 * iOS: delivered as a background push via content-available=1.
 *
 * @param userId - Target user's ID.
 * @param data - Data payload for background handler routing.
 * @returns Count of sent vs failed tokens.
 */
export async function sendSilentPushToUser(
  userId: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  try {
    if (isCircuitOpen()) return { sent: 0, failed: 0 };

    const messaging = await getMessaging();
    if (!messaging) return { sent: 0, failed: 0 };

    const tokens = await getActiveTokens(userId);
    if (tokens.length === 0) return { sent: 0, failed: 0 };

    return await _sendDataToTokens(messaging, tokens, data);
  } catch (error) {
    console.error('[push-service] sendSilentPushToUser error:', error);
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

    const devices = await db.query.deviceTokens.findMany({
      where: and(inArray(deviceTokens.userId, userIds), eq(deviceTokens.active, true)),
      columns: { token: true },
    });
    const tokens = devices.map((d) => d.token);
    if (tokens.length === 0) return { sent: 0, failed: 0 };

    return await sendToTokens(messaging, userIds[0] ?? '', tokens, title, body, data);
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
  console.log(`[sendTestPushDiagnostic] START userId=${userId.substring(0, 8)}...`);
  
  const tokens = await getActiveTokens(userId);
  const deviceCount = tokens.length;

  console.log(
    `[sendTestPushDiagnostic] Found ${deviceCount} active device(s) for userId=${userId.substring(0, 8)}...`,
    deviceCount > 0 ? { tokenPrefixes: tokens.map((t) => t.substring(0, 16)) } : {},
  );

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
  console.log('[sendTestPushDiagnostic] getMessaging result:', {
    isNull: messaging === null,
    isUndefined: messaging === undefined,
    type: typeof messaging,
    hasMethod: messaging ? typeof messaging.sendEachForMulticast : 'N/A',
  });
  
  if (!messaging) {
    console.error('[sendTestPushDiagnostic] getMessaging returned null/undefined');
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
      userId,
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
  userId: string,
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  // Validate inputs
  if (!messaging) {
    console.error('[sendToTokens] messaging is null/undefined');
    return { sent: 0, failed: tokens.length };
  }
  if (typeof messaging.sendEachForMulticast !== 'function') {
    console.error('[sendToTokens] messaging.sendEachForMulticast is not a function', {
      type: typeof messaging.sendEachForMulticast,
      messagingKeys: Object.keys(messaging),
    });
    return { sent: 0, failed: tokens.length };
  }
  if (!Array.isArray(tokens) || tokens.length === 0) {
    console.warn('[sendToTokens] tokens is not an array or is empty');
    return { sent: 0, failed: 0 };
  }

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

  // Cleanup stale tokens asynchronously and send a silent TOKEN_REFRESH push
  // to the affected user's remaining active devices. This triggers the mobile
  // app to call refreshAndRegisterToken() without requiring a sign-out/in,
  // breaking the spin cycle where the same rejected token keeps getting re-posted.
  if (staleTokens.length > 0) {
    deactivateTokens(staleTokens).catch((err) =>
      console.error('[push-service] Failed to deactivate stale tokens:', err)
    );
    // Notify the user's remaining devices to re-register with a fresh token.
    // Must use sendSilentPushToUser (data-only, no `notification` key) so that
    // Android does not attempt to render a notification with an empty title —
    // which causes a NullPointerException in NotificationCompat when the app
    // is in background or terminated.
    sendSilentPushToUser(userId, { type: 'FCM_TOKEN_REFRESH' }).catch(() => {});
  }

  return { sent: totalSent, failed: totalFailed };
}

/**
 * Core send logic for silent (data-only) pushes.
 * Identical batching/retry/stale-token-cleanup as sendToTokens, but
 * builds a message without the `notification` key and adds
 * platform-specific hints for background delivery.
 */
async function _sendDataToTokens(
  messaging: any,
  tokens: string[],
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  if (!messaging) {
    console.error('[_sendDataToTokens] messaging is null/undefined');
    return { sent: 0, failed: tokens.length };
  }
  if (typeof messaging.sendEachForMulticast !== 'function') {
    console.error('[_sendDataToTokens] messaging.sendEachForMulticast is not a function');
    return { sent: 0, failed: tokens.length };
  }
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let totalSent = 0;
  let totalFailed = 0;
  const staleTokens: string[] = [];

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);

    const message = {
      data: data ?? {},
      tokens: batch,
      android: { priority: 'high' as const },
      apns: {
        headers: { 'apns-push-type': 'background', 'apns-priority': '5' },
        payload: { aps: { 'content-available': 1 } },
      },
    };

    let response: any = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        response = await messaging.sendEachForMulticast(message);
        recordSuccess();
        break;
      } catch (error: unknown) {
        const isRetryable = isRetryableError(error);
        if (!isRetryable || attempt === MAX_RETRIES) {
          recordFailure();
          console.error(`[push-service] Silent batch send failed after ${attempt + 1} attempts:`, error);
          totalFailed += batch.length;
          break;
        }
        await sleep(RETRY_DELAYS[attempt]);
      }
    }

    if (response) {
      totalSent += response.successCount;
      totalFailed += response.failureCount;

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
