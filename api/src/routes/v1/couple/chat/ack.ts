import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.js";
import { db } from "../../../plugins/db.js";
import { coupleMembers, coupleMessages } from "../../../../../db/schema.js";
import { eq, and, ne, inArray } from "drizzle-orm";
import { z } from "zod";

type AuthReq = { userId: string };
const DELETABLE_TYPES = new Set(["TEXT", "VOICE", "REMINDER", "MILESTONE", "LIST"]);

const schema = z.object({ messageIds: z.array(z.string().uuid()).min(1).max(100) });

export async function registerChatAckRoute(app: FastifyInstance) {
  app.post("/", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ success: false, error: "Invalid request" });
    const { messageIds } = parsed.data;

    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId), columns: { coupleId: true } });
    if (!member) return reply.code(404).send({ success: false, error: "No couple" });

    const messages = await db.select({ id: coupleMessages.id, senderId: coupleMessages.senderId, type: coupleMessages.type, deliveredAt: coupleMessages.deliveredAt })
      .from(coupleMessages)
      .where(and(inArray(coupleMessages.id, messageIds), eq(coupleMessages.coupleId, member.coupleId), ne(coupleMessages.senderId, userId)));

    const toUpdate = messages.filter(m => m.deliveredAt === null);
    if (toUpdate.length > 0) {
      await db.update(coupleMessages).set({ deliveredAt: new Date() }).where(inArray(coupleMessages.id, toUpdate.map(m => m.id)));
    }

    // Delete non-image messages immediately (both parties have local copy)
    const toDelete = messages.filter(m => DELETABLE_TYPES.has(m.type));
    if (toDelete.length > 0) {
      await db.delete(coupleMessages).where(inArray(coupleMessages.id, toDelete.map(m => m.id)));
    }

    return reply.send({ success: true, acknowledged: toUpdate.length, deleted: toDelete.length });
  });
}
