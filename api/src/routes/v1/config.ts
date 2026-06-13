import { FastifyInstance } from "fastify";
import { db } from "../../plugins/db.js";
import { appConfig } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export async function registerConfigRoute(app: FastifyInstance) {
  app.get("/", async (_req, reply) => {
    try {
      let config = await db.query.appConfig.findFirst({ where: eq(appConfig.id, "singleton") });
      if (!config) {
        const [created] = await db.insert(appConfig).values({
          id: "singleton", minAppVersion: "1.0.0",
          enabledFeatures: ["finance", "chat"], maintenanceMode: false, maintenanceMessage: "",
        }).onConflictDoNothing().returning();
        config = created;
      }
      return reply
        .header("Cache-Control", "public, max-age=60, stale-while-revalidate=120")
        .send({
          minAppVersion: config.minAppVersion,
          enabledFeatures: config.enabledFeatures,
          maintenanceMode: config.maintenanceMode,
          maintenanceMessage: config.maintenanceMessage,
        });
    } catch {
      return reply.send({ minAppVersion: "1.0.0", enabledFeatures: ["finance", "chat"], maintenanceMode: false, maintenanceMessage: "" });
    }
  });
}
