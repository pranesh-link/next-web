/**
 * Chat push notification using Firebase Admin SDK (FCM HTTP v1).
 * Replaces the deprecated legacy /fcm/send API.
 */
import { db } from "./db.js";
import { coupleMembers, users, deviceTokens } from "./schema.js";
import { and, eq, ne, inArray } from "drizzle-orm";

// ── Firebase Admin lazy init ──────────────────────────────────────────────────

let _messaging: any = null;

async function getMessaging(): Promise<any | null> {
  if (_messaging) return _messaging;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    console.warn("[chat-push] FIREBASE_SERVICE_ACCOUNT_JSON not set — push disabled");
    return null;
  }

  try {
    const adminModule = await import("firebase-admin" as string);
    const admin = (adminModule as any).default || adminModule;

    if (!admin.apps || admin.apps.length === 0) {
      const credential = JSON.parse(
        Buffer.from(serviceAccountJson, "base64").toString("utf-8")
      );
      admin.initializeApp({ credential: admin.credential.cert(credential) });
      console.log("[chat-push] firebase-admin initialized");
    }

    _messaging = admin.messaging();
    return _messaging;
  } catch (err) {
    console.error("[chat-push] firebase-admin init failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

async function deactivateTokens(tokens: string[]) {
  if (tokens.length === 0) return;
  await db.update(deviceTokens).set({ active: false }).where(inArray(deviceTokens.token, tokens)).catch(() => {});
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  try {
    const messaging = await getMessaging();
    if (!messaging) return { sent: 0, failed: 0 };

    const devices = await db.query.deviceTokens.findMany({
      where: and(eq(deviceTokens.userId, userId), eq(deviceTokens.active, true)),
      columns: { token: true },
    });
    if (devices.length === 0) return { sent: 0, failed: 0 };

    const tokens = devices.map((d: { token: string }) => d.token);
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: data ?? {},
      android: { priority: "high" },
      apns: { payload: { aps: { contentAvailable: true } } },
    });

    // Deactivate stale tokens
    const stale: string[] = [];
    response.responses.forEach((r: any, i: number) => {
      if (!r.success) {
        const code = r.error?.code ?? "";
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          stale.push(tokens[i]);
        }
      }
    });
    if (stale.length > 0) deactivateTokens(stale);

    console.log(`[chat-push] sent=${response.successCount} failed=${response.failureCount} userId=${userId.substring(0, 8)}`);
    return { sent: response.successCount, failed: response.failureCount };
  } catch (err) {
    console.error("[chat-push] sendPushToUser error:", err instanceof Error ? err.message : String(err));
    return { sent: 0, failed: 0 };
  }
}

export async function sendChatPushNotification(senderId: string, coupleId: string): Promise<void> {
  try {
    const partner = await db.query.coupleMembers.findFirst({
      where: and(eq(coupleMembers.coupleId, coupleId), ne(coupleMembers.userId, senderId)),
      columns: { userId: true },
    });
    if (!partner) return;

    const sender = await db.query.users.findFirst({
      where: eq(users.id, senderId),
      columns: { name: true },
    });

    await sendPushToUser(
      partner.userId,
      sender?.name ?? "Partner",
      "New message",
      { type: "CHAT_MESSAGE", route: "/chat", featureId: coupleId }
    );
  } catch (err) {
    console.error("[chat-push] sendChatPushNotification error:", err instanceof Error ? err.message : String(err));
  }
}
