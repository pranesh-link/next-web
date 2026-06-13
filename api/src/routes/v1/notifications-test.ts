import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.js";
import { sendPushToUser } from "../../shared/chat-push.js";
import { db } from "../../plugins/db.js";
import { deviceTokens } from "../../shared/schema.js";
import { and, eq } from "drizzle-orm";

type AuthReq = { userId: string };

export async function registerNotificationsTestRoute(app: FastifyInstance) {
  app.post("/test", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;

    const devices = await db.query.deviceTokens.findMany({
      where: and(eq(deviceTokens.userId, userId), eq(deviceTokens.active, true)),
      columns: { token: true, platform: true, deviceInfo: true },
    });

    const deviceCount = devices.length;
    const fcmConfigured = !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (deviceCount === 0) {
      return reply.send({ success: false, reason: "NO_DEVICES", deviceCount, fcmConfigured });
    }
    if (!fcmConfigured) {
      return reply.send({ success: false, reason: "FCM_NOT_CONFIGURED", deviceCount, fcmConfigured });
    }

    const { sent, failed } = await sendPushToUser(
      userId,
      "🔔 LuvVerse Test",
      "Push notifications are working!",
      { type: "TEST", featureId: "", notificationId: "" }
    );

    return reply.send({
      success: sent > 0,
      reason: sent > 0 ? "OK" : "ALL_FAILED",
      sent,
      failed,
      deviceCount,
      fcmConfigured,
      devices: devices.map(d => ({ platform: d.platform, deviceInfo: d.deviceInfo ?? null })),
    });
  });
}
