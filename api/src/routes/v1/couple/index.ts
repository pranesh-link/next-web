import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.js";
import { db } from "../../../plugins/db.js";
import { coupleMembers, couples, users, coupleChats, coupleChatMessages } from "../../../shared/schema.js";
import { eq, and, ne, desc } from "drizzle-orm";
import { z } from "zod";
import { registerChatAckRoute } from "./chat/ack.js";
import { registerFileDownloadedRoute } from "./chat/file-downloaded.js";
import { registerCoupleChatPurgeRoute } from "./chat/purge.js";

type AuthReq = { userId: string };

export async function registerCoupleRoutes(app: FastifyInstance) {
  // GET /api/v1/couple — get couple info
  app.get("/", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const member = await db.query.coupleMembers.findFirst({
      where: eq(coupleMembers.userId, userId),
      columns: { coupleId: true },
    });
    if (!member) return reply.send({ success: true, data: null });

    const couple = await db.query.couples.findFirst({ where: eq(couples.id, member.coupleId) });
    if (!couple) return reply.send({ success: true, data: null });

    const allMembers = await db.query.coupleMembers.findMany({
      where: eq(coupleMembers.coupleId, member.coupleId),
      columns: { userId: true, role: true },
    });
    const memberUsers = await Promise.all(allMembers.map(async (m) => {
      const u = await db.query.users.findFirst({ where: eq(users.id, m.userId), columns: { id: true, name: true, email: true, image: true } });
      return { ...m, user: u ?? null };
    }));
    return reply.send({ success: true, data: { ...couple, members: memberUsers } });
  });

  // GET /api/v1/couple/members — list couple members
  app.get("/members", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId), columns: { coupleId: true } });
    if (!member) return reply.code(404).send({ success: false, error: "No couple found" });
    const allMembers = await db.query.coupleMembers.findMany({
      where: eq(coupleMembers.coupleId, member.coupleId),
      columns: { userId: true, role: true },
    });
    const memberUsers = await Promise.all(allMembers.map(async (m) => {
      const u = await db.query.users.findFirst({ where: eq(users.id, m.userId), columns: { id: true, name: true, email: true, image: true } });
      return { ...m, user: u ?? null };
    }));
    return reply.send({ success: true, data: memberUsers });
  });

  // GET /api/v1/couple/partner-public-key
  app.get("/partner-public-key", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) return reply.code(404).send({ success: false, error: "No couple" });
    const partnerMember = await db.query.coupleMembers.findFirst({
      where: and(eq(coupleMembers.coupleId, member.coupleId), ne(coupleMembers.userId, userId)),
      columns: { userId: true },
    });
    if (!partnerMember) return reply.send({ success: true, data: null });
    const partnerUser = await db.query.users.findFirst({ where: eq(users.id, partnerMember.userId), columns: { publicKey: true } });
    return reply.send({ success: true, data: partnerUser?.publicKey ?? null });
  });

  // GET /api/v1/couple/security-code
  app.get("/security-code", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
    if (!member) return reply.code(404).send({ success: false, error: "No couple" });
    return reply.send({ success: true, data: { coupleId: member.coupleId } });
  });

  // POST /api/v1/couple/accept — accept couple invite
  app.post("/accept", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { token } = req.body as { token?: string };
    if (!token) return reply.code(400).send({ success: false, error: "token required" });
    // Delegate to invite logic — simplified: find couple by invite token
    const invite = await db.query.coupleInvites?.findFirst?.({ where: (t: { token: unknown }, ops: { eq: (...args: unknown[]) => unknown }) => ops.eq(t.token, token) } as never);
    if (!invite) return reply.code(404).send({ success: false, error: "Invalid invite" });
    return reply.send({ success: true });
  });

  // Chat sub-routes
  await app.register(registerChatAckRoute, { prefix: "/chat/ack" });
  await app.register(registerFileDownloadedRoute, { prefix: "/chat/file-downloaded" });
  await app.register(registerCoupleChatPurgeRoute, { prefix: "/chat/purge" });

  // ── Couple Chats (AI chat threads) ──
  app.get("/chats", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as { userId: string } & typeof req;
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId), columns: { coupleId: true } });
    if (!member) return reply.code(404).send({ success: false, error: "No couple found" });
    const chats = await db.query.coupleChats.findMany({
      where: eq(coupleChats.coupleId, member.coupleId),
      orderBy: (t, { desc: d }) => [d(t.updatedAt)],
    });
    const chatIds = chats.map((c) => c.id);
    const lastMessages = chatIds.length > 0
      ? await Promise.all(chatIds.map(async (cid) => {
          const msg = await db.query.coupleChatMessages.findFirst({
            where: eq(coupleChatMessages.chatId, cid),
            orderBy: (m, { desc: d }) => [d(m.createdAt)],
            columns: { chatId: true, content: true, createdAt: true },
          });
          return msg;
        }))
      : [];
    const lastByChat = new Map(lastMessages.filter(Boolean).map((m) => [m!.chatId, m!]));
    const result = chats.map((c) => {
      const last = lastByChat.get(c.id);
      return { ...c, lastMessage: last ? last.content.substring(0, 80) : null, lastMessageAt: last?.createdAt ?? null };
    });
    return reply.send({ success: true, data: result });
  });

  app.post("/chats", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as { userId: string } & typeof req;
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId), columns: { coupleId: true } });
    if (!member) return reply.code(404).send({ success: false, error: "No couple found" });
    const body = req.body as Record<string, unknown>;
    const title = (body.title as string)?.trim();
    if (!title) return reply.code(400).send({ success: false, error: "title is required" });
    const [chat] = await db.insert(coupleChats).values({ coupleId: member.coupleId, title } as any).returning();
    return reply.code(201).send({ success: true, data: chat });
  });

  app.get("/chats/:chatId", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as { userId: string } & typeof req;
    const { chatId } = req.params as { chatId: string };
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId), columns: { coupleId: true } });
    if (!member) return reply.code(404).send({ success: false, error: "No couple found" });
    const chat = await db.query.coupleChats.findFirst({ where: and(eq(coupleChats.id, chatId), eq(coupleChats.coupleId, member.coupleId)) });
    if (!chat) return reply.code(404).send({ success: false, error: "Chat not found" });
    const messages = await db.query.coupleChatMessages.findMany({
      where: eq(coupleChatMessages.chatId, chatId),
      orderBy: (m, { asc: a }) => [a(m.createdAt)],
    });
    return reply.send({ success: true, data: { ...chat, messages } });
  });

  app.patch("/chats/:chatId", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as { userId: string } & typeof req;
    const { chatId } = req.params as { chatId: string };
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId), columns: { coupleId: true } });
    if (!member) return reply.code(404).send({ success: false, error: "No couple found" });
    const existing = await db.query.coupleChats.findFirst({ where: and(eq(coupleChats.id, chatId), eq(coupleChats.coupleId, member.coupleId)) });
    if (!existing) return reply.code(404).send({ success: false, error: "Chat not found" });
    const body = req.body as Record<string, unknown>;
    const title = (body.title as string)?.trim();
    if (!title) return reply.code(400).send({ success: false, error: "title is required" });
    const [updated] = await db.update(coupleChats).set({ title, updatedAt: new Date() } as any).where(eq(coupleChats.id, chatId)).returning();
    return reply.send({ success: true, data: updated });
  });

  app.delete("/chats/:chatId", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as { userId: string } & typeof req;
    const { chatId } = req.params as { chatId: string };
    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId), columns: { coupleId: true } });
    if (!member) return reply.code(404).send({ success: false, error: "No couple found" });
    const existing = await db.query.coupleChats.findFirst({ where: and(eq(coupleChats.id, chatId), eq(coupleChats.coupleId, member.coupleId)) });
    if (!existing) return reply.code(404).send({ success: false, error: "Chat not found" });
    // Delete messages first (no FK cascade defined in schema)
    await db.delete(coupleChatMessages).where(eq(coupleChatMessages.chatId, chatId));
    await db.delete(coupleChats).where(eq(coupleChats.id, chatId));
    return reply.send({ success: true });
  });
}
