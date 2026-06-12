import { sendPushToUser } from "@/_services/finance/push-service";
import { db } from "@db";
import { coupleMembers, users } from "@db/schema";
import { and, eq, ne } from "drizzle-orm";

/**
 * Sends an FCM push notification to the sender's partner when a new chat
 * message is created. Fire-and-forget — never throws.
 *
 * @param senderId - The user who sent the message.
 * @param coupleId - The couple the message belongs to.
 */
export async function sendChatPushNotification(
  senderId: string,
  coupleId: string,
): Promise<void> {
  try {
    // Find partner
    const partner = await db.query.coupleMembers.findFirst({
      where: and(eq(coupleMembers.coupleId, coupleId), ne(coupleMembers.userId, senderId)),
      columns: { userId: true },
    });
    if (!partner) return;

    // Get sender name for notification title
    const sender = await db.query.users.findFirst({
      where: eq(users.id, senderId),
      columns: { name: true },
    });

    await sendPushToUser(partner.userId, sender?.name ?? "Partner", "New message", {
      type: "CHAT_MESSAGE",
      route: "/chat",
      featureId: coupleId,
    });
  } catch (error) {
    console.error("[chat-push] Failed to send push:", error);
  }
}
