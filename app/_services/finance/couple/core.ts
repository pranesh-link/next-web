import { db } from '@db';
import { couples, coupleMembers, coupleInvites, users } from '@db/schema';
import { eq, and, asc, desc, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/_lib/cache';

/**
 * Create a new couple owned by the given user.
 *
 * @param userId - The user id who owns the new couple (role `OWNER`).
 * @param name - Optional display name for the couple.
 * @returns The newly created couple including its members.
 */
export async function createCouple(userId: string, name?: string) {
  const [couple] = await db.insert(couples).values({ name: name || null }).returning();
  await db.insert(coupleMembers).values({ coupleId: couple.id, userId, role: 'OWNER' });
  const members = await db.query.coupleMembers.findMany({
    where: eq(coupleMembers.coupleId, couple.id),
  });
  const membersWithUser = await Promise.all(
    members.map(async (m) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, m.userId),
        columns: { id: true, name: true, email: true, image: true },
      });
      return { ...m, user };
    })
  );
  revalidateTag(CACHE_TAGS.COUPLE_MEMBERS);
  return { ...couple, members: membersWithUser };
}

/**
 * Get the couple the given user belongs to, including members and
 * pending invites.
 *
 * @param userId - The signed-in user id.
 * @returns The couple record (with members + pending invites) or `null`.
 */
export async function getCoupleForUser(userId: string) {
  const membership = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
    columns: { coupleId: true },
  });
  if (!membership) return null;

  const couple = await db.query.couples.findFirst({
    where: eq(couples.id, membership.coupleId),
  });
  if (!couple) return null;

  const members = await db.query.coupleMembers.findMany({
    where: eq(coupleMembers.coupleId, couple.id),
  });
  const membersWithUser = await Promise.all(
    members.map(async (m) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, m.userId),
        columns: { id: true, name: true, email: true, image: true },
      });
      return { ...m, user };
    })
  );
  const invites = await db.query.coupleInvites.findMany({
    where: and(eq(coupleInvites.coupleId, couple.id), eq(coupleInvites.status, 'PENDING')),
    orderBy: desc(coupleInvites.createdAt),
  });

  return { ...couple, members: membersWithUser, invites };
}

/**
 * List members of a couple in join-order.
 *
 * @param coupleId - The couple id.
 * @returns Members with their user `id`, `name`, `email`, `image`.
 */
export async function getCoupleMembers(coupleId: string) {
  const members = await db.query.coupleMembers.findMany({
    where: eq(coupleMembers.coupleId, coupleId),
    orderBy: asc(coupleMembers.joinedAt),
  });
  return Promise.all(
    members.map(async (m) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, m.userId),
        columns: { id: true, name: true, email: true, image: true },
      });
      return { ...m, user };
    })
  );
}

/**
 * Remove the signed-in user from their couple. Deletes the couple if
 * the user was the last remaining member.
 *
 * @param userId - The signed-in user id.
 * @returns `{ success: true }` on completion.
 * @throws {Error} when the user is not in a couple.
 */
export async function leaveCouple(userId: string) {
  const membership = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
  });
  if (!membership) throw new Error('Not in a couple');

  await db.delete(coupleMembers).where(eq(coupleMembers.id, membership.id));

  const remaining = await db.select({ count: sql<number>`count(*)` })
    .from(coupleMembers)
    .where(eq(coupleMembers.coupleId, membership.coupleId));
  if (Number(remaining[0]?.count ?? 0) === 0) {
    await db.delete(couples).where(eq(couples.id, membership.coupleId));
  }

  revalidateTag(CACHE_TAGS.COUPLE_MEMBERS);

  return { success: true };
}

/**
 * Rename the couple the signed-in user belongs to.
 *
 * @param userId - The signed-in user id.
 * @param newName - New display name (empty string clears the name).
 * @returns The updated couple record.
 * @throws {Error} when the user is not in a couple.
 */
export async function renameCouple(userId: string, newName: string) {
  const membership = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
    columns: { coupleId: true },
  });
  if (!membership) throw new Error('Not in a couple');

  const [couple] = await db.update(couples)
    .set({ name: newName || null })
    .where(eq(couples.id, membership.coupleId))
    .returning();
  return couple;
}

/**
 * Disband (delete) the couple the signed-in user belongs to. Cascades
 * to all `CoupleMember` and `CoupleInvite` rows.
 *
 * @param userId - The signed-in user id.
 * @returns `{ success: true }` on completion.
 * @throws {Error} when the user is not in a couple.
 */
export async function disbandCouple(userId: string) {
  const membership = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
    columns: { coupleId: true },
  });
  if (!membership) throw new Error('Not in a couple');

  await db.delete(couples).where(eq(couples.id, membership.coupleId));

  revalidateTag(CACHE_TAGS.COUPLE_MEMBERS);

  return { success: true };
}
