/**
 * Chat push notification — no Next.js dependencies.
 * Sends FCM push to partner when a new chat message is created.
 */
import { db } from "./db.js";
import { coupleMembers, users, deviceTokens } from "./schema.js";
import { and, eq, ne } from "drizzle-orm";

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

    const tokens = await db.query.deviceTokens.findMany({
      where: and(eq(deviceTokens.userId, partner.userId), eq(deviceTokens.active, true)),
      columns: { token: true, platform: true },
    });
    if (tokens.length === 0) return;

    // Fire-and-forget FCM via Fly secrets (optional — skip if not configured)
    const fcmKey = process.env.FCM_SERVER_KEY;
    if (!fcmKey) return;

    await Promise.allSettled(tokens.map((t) =>
      fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `key=${fcmKey}` },
        body: JSON.stringify({
          to: t.token,
          notification: { title: sender?.name ?? "Partner", body: "New message" },
          data: { type: "CHAT_MESSAGE", route: "/chat", featureId: coupleId },
        }),
      }).catch(() => {}),
    ));
  } catch (error) {
    console.error("[chat-push] Failed:", error);
  }
}
