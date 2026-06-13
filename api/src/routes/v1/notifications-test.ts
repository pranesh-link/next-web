import { FastifyInstance } from "fastify";

export async function registerNotificationsTestRoute(app: FastifyInstance) {
  app.post("/test", async (_req, reply) => {
    return reply.send({ success: true, message: "Push notification test not supported on Fly.io server" });
  });
}
