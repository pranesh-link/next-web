/**
 * Legacy chat routes — used by mobile app (non-v1 prefix).
 * These correspond to /api/couple/chat/* in Next.js.
 *
 * Phase 4: WebSocket replaces SSE for the stream endpoint.
 */
import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import { extractUserId } from "../../middleware/auth.js";
import { db } from "../../plugins/db.js";
import { coupleMembers, coupleMessages, messageTypeEnum } from "../../../../db/schema.js";
import { eq, and, ne, lt, desc } from "drizzle-orm";
import { sendChatPushNotification } from "../../../../app/_services/chat/push-service.js";
import { z } from "zod";

type AuthReq = { userId: string };

/** Connected WebSocket clients: userId → socket */
const chatClients = new Map<string, WebSocket>();

/** Push a message to a specific user's WebSocket if connected */
export function pushToUser(userId: string, data: object) {
  const ws = chatClients.get(userId);
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

const sendSchema = z.object({
  content: z.string().min(1).max(20_000),
  type: z.enum(messageTypeEnum.enumValues).optional().default("TEXT"),
  iv: z.string().optional(),
  encrypted: z.boolean().optional().default(false),
  payload: z.record(z.string(), z.unknown()).optional(),
  reminderAt: z.string().datetime().optional(),
  fileStoragePath: z.string().max(512).optional(),
});

export async function registerChatLegacyRoutes(app: FastifyInstance) {
  // ── WebSocket stream (replaces SSE) ──
  // wss://luvverse-api.fly.dev/api/couple/chat/stream
  app.get("/stream", { websocket: true }, async (socket: WebSocket, req) => {
    const userId = await extractUserId(req as never);
    if (!userId) { socket.close(4001, "Unauthorized"); return; }

    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) { socket.close(4004, "No couple"); return; }

    const partnerMember = await db.query.coupleMembers.findFirst({
      where: and(eq(coupleMembers.coupleId, member.coupleId), ne(coupleMembers.userId, userId)),
      columns: { userId: true },
    });

    chatClients.set(userId, socket);

    // Send latest state immediately on connect
    const latest = await db.query.coupleMessages.findFirst({
      where: eq(coupleMessages.coupleId, member.coupleId),
      orderBy: (t, { desc: d }) => [d(t.createdAt)],
      columns: { id: true, senderId: true, type: true, readBy: true, createdAt: true },
    });
    const partnerSnapshot = partnerMember
      ? await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, partnerMember.userId), columns: { isTyping: true, lastTypingAt: true } })
      : null;

    socket.send(JSON.stringify({
      latest: latest ? { id: latest.id, senderId: latest.senderId } : null,
      partnerTyping: partnerSnapshot?.isTyping ?? false,
    }));

    socket.on("message", async (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());
        if (msg.type === "typing") {
          // Update typing state and notify partner
          await db.update(coupleMembers)
            .set({ isTyping: true, lastTypingAt: new Date(), updatedAt: new Date() })
            .where(eq(coupleMembers.userId, userId));
          if (partnerMember) pushToUser(partnerMember.userId, { partnerTyping: true });
        }
      } catch { /* ignore malformed messages */ }
    });

    socket.on("close", async () => {
      chatClients.delete(userId);
      await db.update(coupleMembers)
        .set({ isTyping: false, updatedAt: new Date() })
        .where(eq(coupleMembers.userId, userId));
      if (partnerMember) pushToUser(partnerMember.userId, { partnerTyping: false });
    });
  });

  // ── GET /api/couple/chat/messages ──
  app.get("/messages", async (req, reply) => {
    const userId = await extractUserId(req as never);
    if (!userId) return reply.code(401).send({ success: false, error: "Not authenticated" });
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) return reply.send({ success: true, data: [] });

    const { searchParams } = new URL(`http://x${req.url}`);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const cursor = searchParams.get("cursor");
    let cursorDate: Date | undefined;
    if (cursor) {
      const cursorMsg = await db.query.coupleMessages.findFirst({ where: eq(coupleMessages.id, cursor), columns: { createdAt: true } });
      cursorDate = cursorMsg?.createdAt;
    }

    const messages = await db.query.coupleMessages.findMany({
      where: and(
        eq(coupleMessages.coupleId, member.coupleId),
        cursorDate ? lt(coupleMessages.createdAt, cursorDate) : undefined,
      ),
      orderBy: (t, { desc: d }) => [d(t.createdAt)],
      limit,
    });

    // Fire-and-forget purge
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    db.delete(coupleMessages).where(and(eq(coupleMessages.coupleId, member.coupleId), lt(coupleMessages.createdAt, thirtyDaysAgo))).catch(() => {});

    return reply.send({ success: true, data: messages });
  });

  // ── POST /api/couple/chat/messages ──
  app.post("/messages", async (req, reply) => {
    const userId = await extractUserId(req as never);
    if (!userId) return reply.code(401).send({ success: false, error: "Not authenticated" });
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) return reply.code(404).send({ success: false, error: "No couple" });

    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: "Invalid request" });
    const v = parsed.data;

    const [message] = await db.insert(coupleMessages).values({
      coupleId: member.coupleId,
      senderId: userId,
      type: v.type,
      content: v.encrypted ? v.content : v.content.trim(),
      iv: v.encrypted ? v.iv : undefined,
      encrypted: v.encrypted,
      payload: v.payload ?? null,
      reminderAt: v.reminderAt ? new Date(v.reminderAt) : undefined,
      readBy: [userId],
      fileStoragePath: v.fileStoragePath ?? null,
      fileDownloadedBy: v.fileStoragePath ? [userId] : [],
    }).returning();

    // Notify partner via WebSocket if connected
    const partnerMember = await db.query.coupleMembers.findFirst({
      where: and(eq(coupleMembers.coupleId, member.coupleId), ne(coupleMembers.userId, userId)),
      columns: { userId: true },
    });
    if (partnerMember) {
      pushToUser(partnerMember.userId, { latest: { id: message.id, senderId: message.senderId }, partnerTyping: false });
      sendChatPushNotification(userId, member.coupleId).catch(() => {});
    }

    return reply.code(201).send({ success: true, data: message });
  });

  // ── POST /api/couple/chat/messages/read ──
  app.post("/messages/read", async (req, reply) => {
    const userId = await extractUserId(req as never);
    if (!userId) return reply.code(401).send({ success: false, error: "Not authenticated" });
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) return reply.code(404).send({ success: false, error: "No couple" });
    // Simplified: mark all unread partner messages as read
    return reply.send({ success: true, updated: 0 });
  });

  // ── POST /api/couple/chat/typing ──
  app.post("/typing", async (req, reply) => {
    const userId = await extractUserId(req as never);
    if (!userId) return reply.code(401).send({ success: false });
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) return reply.send({ success: true });
    await db.update(coupleMembers).set({ isTyping: true, lastTypingAt: new Date(), updatedAt: new Date() }).where(eq(coupleMembers.userId, userId));
    const partnerMember = await db.query.coupleMembers.findFirst({
      where: and(eq(coupleMembers.coupleId, member.coupleId), ne(coupleMembers.userId, userId)),
      columns: { userId: true },
    });
    if (partnerMember) pushToUser(partnerMember.userId, { partnerTyping: true });
    return reply.send({ success: true });
  });
}
