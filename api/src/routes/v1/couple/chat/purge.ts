import { FastifyInstance } from "fastify";
import { purgeExpiredMessages, cleanupDeliveredMessages } from "../../../../../../app/_services/chat/message-purge.js";

const CRON_SECRET = process.env.CRON_SECRET;

export async function registerCoupleChatPurgeRoute(app: FastifyInstance) {
  app.post("/", async (req, reply) => {
    const auth = req.headers.authorization;
    if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) return reply.code(401).send({ success: false, error: "Unauthorized" });
    const [expired, delivered] = await Promise.all([purgeExpiredMessages(), cleanupDeliveredMessages()]);
    return reply.send({ success: true, purged: { expired, delivered } });
  });
}
