/**
 * Couple membership helpers — no Next.js cache dependencies.
 * Direct DB queries, no caching (Fastify server handles its own request lifecycle).
 */
import { db } from "./db.js";
import { coupleMembers } from "./schema.js";
import { eq } from "drizzle-orm";

export async function getUserIdsForCouple(userId: string): Promise<string[]> {
  const membership = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
    columns: { coupleId: true },
  });
  if (!membership) return [userId];
  const members = await db.query.coupleMembers.findMany({
    where: eq(coupleMembers.coupleId, membership.coupleId),
    columns: { userId: true },
  });
  return members.map((m) => m.userId);
}

export async function getCoupleIdForUser(userId: string): Promise<string | null> {
  const membership = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
    columns: { coupleId: true },
  });
  return membership?.coupleId ?? null;
}
