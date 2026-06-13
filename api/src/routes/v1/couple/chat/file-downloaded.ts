import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.js";
import { db } from "../../../plugins/db.js";
import { coupleMembers, coupleMessages } from "../../../../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { deleteStorageFiles } from "../../../../lib/supabase-storage.js";
import { z } from "zod";

type AuthReq = { userId: string };
const schema = z.object({ messageId: z.string().uuid() });

export async function registerFileDownloadedRoute(app: FastifyInstance) {
  app.post("/", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid request" });
    const { messageId } = parsed.data;

    const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId), columns: { coupleId: true } });
    if (!member) return reply.code(404).send({ error: "No couple" });

    const allMembers = await db.select({ userId: coupleMembers.userId }).from(coupleMembers).where(eq(coupleMembers.coupleId, member.coupleId));
    const allMemberIds = allMembers.map(m => m.userId);

    const message = await db.query.coupleMessages.findFirst({
      where: and(eq(coupleMessages.id, messageId), eq(coupleMessages.coupleId, member.coupleId)),
      columns: { id: true, fileDownloadedBy: true, fileStoragePath: true, type: true },
    });
    if (!message) return reply.code(404).send({ error: "Message not found" });
    if (message.fileDownloadedBy.includes(userId)) return reply.send({ success: true, fileDeleted: false, messageDeleted: false });

    const updatedDownloadedBy = [...message.fileDownloadedBy, userId];
    await db.update(coupleMessages).set({ fileDownloadedBy: updatedDownloadedBy }).where(eq(coupleMessages.id, messageId));

    const allDownloaded = allMemberIds.every(id => updatedDownloadedBy.includes(id));
    let fileDeleted = false, messageDeleted = false;

    if (allDownloaded) {
      if (message.fileStoragePath) { await deleteStorageFiles([message.fileStoragePath]); fileDeleted = true; }
      await db.delete(coupleMessages).where(eq(coupleMessages.id, messageId));
      messageDeleted = true;
    }

    return reply.send({ success: true, fileDeleted, messageDeleted });
  });
}
