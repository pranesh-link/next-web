import { FastifyInstance } from "fastify";
import { requireAuth } from "../../../middleware/auth.js";
import { db } from "../../../plugins/db.js";
import { bodyMetrics, nutritionLogs, sleepLogs, exerciseLogs, habitLogs } from "../../../../../db/schema.js";
import { eq, and, desc, gte, lt } from "drizzle-orm";

type AuthReq = { userId: string };

export async function registerHealthRoutes(app: FastifyInstance) {
  // Body metrics
  app.get("/body-metrics", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const rows = await db.select().from(bodyMetrics).where(eq(bodyMetrics.userId, userId)).orderBy(desc(bodyMetrics.measuredOn));
    return reply.send({ success: true, data: rows });
  });
  app.post("/body-metrics", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const [row] = await db.insert(bodyMetrics).values({ userId, ...req.body as never }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  // Nutrition
  app.get("/nutrition", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const rows = await db.select().from(nutritionLogs).where(eq(nutritionLogs.userId, userId)).orderBy(desc(nutritionLogs.loggedOn));
    return reply.send({ success: true, data: rows });
  });
  app.post("/nutrition", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const [row] = await db.insert(nutritionLogs).values({ userId, ...req.body as never }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  // Sleep
  app.get("/sleep", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const rows = await db.select().from(sleepLogs).where(eq(sleepLogs.userId, userId)).orderBy(desc(sleepLogs.bedtimeAt));
    return reply.send({ success: true, data: rows });
  });
  app.post("/sleep", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const [row] = await db.insert(sleepLogs).values({ userId, ...req.body as never }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  // Exercise
  app.get("/exercise", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const rows = await db.select().from(exerciseLogs).where(eq(exerciseLogs.userId, userId)).orderBy(desc(exerciseLogs.loggedOn));
    return reply.send({ success: true, data: rows });
  });
  app.post("/exercise", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const [row] = await db.insert(exerciseLogs).values({ userId, ...req.body as never }).returning();
    return reply.code(201).send({ success: true, data: row });
  });

  // Habits
  app.get("/habits", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const rows = await db.select().from(habitLogs).where(eq(habitLogs.userId, userId)).orderBy(desc(habitLogs.date));
    return reply.send({ success: true, data: rows });
  });
  app.post("/habits", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const [row] = await db.insert(habitLogs).values({ userId, ...req.body as never }).returning();
    return reply.code(201).send({ success: true, data: row });
  });
}
