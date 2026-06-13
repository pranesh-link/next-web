import { FastifyInstance } from "fastify";
import { db } from "../../../plugins/db.js";
import { users, deviceTokens } from "../../../../../db/schema.js";
import { eq, and, desc, lt } from "drizzle-orm";

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get("/stats", async (_req, reply) => {
    const [userCount, activeDevices] = await Promise.all([
      db.select().from(users).then(r => r.length),
      db.select().from(deviceTokens).where(and(eq(deviceTokens.active, true))).then(r => r.length),
    ]);
    return reply.send({ success: true, data: { userCount, activeDevices } });
  });

  app.post("/invalidate-cache", async (_req, reply) => {
    return reply.send({ success: true });
  });
}
