import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.js";
import { db } from "../../../plugins/db.js";
import { coupleMembers, couples, users } from "../../../shared/schema.js";
import { eq, and, ne } from "drizzle-orm";
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
}
