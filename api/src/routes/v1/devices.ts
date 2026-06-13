import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.js";
import { db } from "../../plugins/db.js";
import { deviceTokens, users } from "../../../../db/schema.js";
import { eq, and, lt, not } from "drizzle-orm";
import { z } from "zod";

type AuthReq = { userId: string };

const registerSchema = z.object({
  token: z.string().min(1).max(256),
  platform: z.enum(["android", "ios", "web"]),
  deviceInfo: z.string().max(512).optional(),
});

export async function registerDevicesRoute(app: FastifyInstance) {
  app.get("/", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const devices = await db.query.deviceTokens.findMany({
      where: eq(deviceTokens.userId, userId),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    db.delete(deviceTokens).where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.active, false), lt(deviceTokens.updatedAt, thirtyDaysAgo))).catch(() => {});
    return reply.send({ success: true, data: {
      userId,
      devices: devices.map(d => ({ id: d.id, platform: d.platform, active: d.active, deviceInfo: d.deviceInfo ?? null, createdAt: String(d.createdAt), updatedAt: String(d.updatedAt), tokenPrefix: d.token.substring(0, 20) + "..." })),
      activeCount: devices.filter(d => d.active).length,
      totalCount: devices.length,
    }});
  });

  app.post("/", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: "Invalid request" });
    const { token, platform, deviceInfo } = parsed.data;

    const [device] = await db.insert(deviceTokens).values({
      userId, token, platform, active: true, updatedAt: new Date(),
      ...(deviceInfo ? { deviceInfo } : {}),
    }).onConflictDoUpdate({
      target: deviceTokens.token,
      set: { userId, platform, active: true, updatedAt: new Date(), ...(deviceInfo ? { deviceInfo } : {}) },
    }).returning();

    db.update(deviceTokens).set({ active: false }).where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.platform, platform), eq(deviceTokens.active, true), not(eq(deviceTokens.token, token)))).catch(() => {});
    if (deviceInfo) db.update(users).set({ lastDeviceInfo: deviceInfo, lastSeenAt: new Date() }).where(eq(users.id, userId)).catch(() => {});

    return reply.code(201).send({ success: true, data: { id: device.id, platform: device.platform, active: device.active } });
  });

  app.delete("/", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { token } = req.body as { token?: string };
    if (!token) return reply.code(400).send({ success: false, error: "token required" });
    await db.update(deviceTokens).set({ active: false, updatedAt: new Date() }).where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.token, token)));
    return reply.send({ success: true });
  });
}
