import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.js";
import { db } from "../../../plugins/db.js";
import { users } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";

type AuthReq = { userId: string };

export async function registerUserRoutes(app: FastifyInstance) {
  // GET/POST /api/v1/user/public-key
  app.get("/public-key", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { publicKey: true } });
    return reply.send({ success: true, data: user?.publicKey ?? null });
  });

  app.post("/public-key", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { publicKey } = req.body as { publicKey: string };
    await db.update(users).set({ publicKey, updatedAt: new Date() }).where(eq(users.id, userId));
    return reply.send({ success: true });
  });

  // GET/POST /api/v1/user/key-vault
  app.get("/key-vault", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { encryptedKeyVault: true } });
    return reply.send({ success: true, data: user?.encryptedKeyVault ?? null });
  });

  app.post("/key-vault", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { vault } = req.body as { vault: string };
    await db.update(users).set({ encryptedKeyVault: Buffer.from(vault) as any, updatedAt: new Date() }).where(eq(users.id, userId));
    return reply.send({ success: true });
  });
}
