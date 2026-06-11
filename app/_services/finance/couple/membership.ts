import { db } from '@db';
import { coupleMembers } from '@db/schema';
import { eq } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { CACHE_TAGS } from '@/_lib/cache';

const getCoupleUserIdsCached = unstable_cache(
  async (userId: string) => {
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
  },
  ["couple-user-ids"],
  { revalidate: 300, tags: [CACHE_TAGS.COUPLE_MEMBERS] },
);

const getCoupleIdCached = unstable_cache(
  async (userId: string) => {
    const membership = await db.query.coupleMembers.findFirst({
      where: eq(coupleMembers.userId, userId),
      columns: { coupleId: true },
    });
    return membership?.coupleId ?? null;
  },
  ["couple-id-for-user"],
  { revalidate: 300, tags: [CACHE_TAGS.COUPLE_MEMBERS] },
);

/**
 * Resolve all user ids that share data with the given user via a couple.
 *
 * For solo users this returns `[userId]`. For coupled users it returns the
 * ids of both members. Cached for 5 minutes; invalidated by the
 * `COUPLE_MEMBERS` cache tag.
 *
 * @param userId - The signed-in user id.
 * @returns Array of user ids whose financial data should be aggregated.
 */
export async function getUserIdsForCouple(userId: string): Promise<string[]> {
  return getCoupleUserIdsCached(userId);
}

/**
 * Resolve the couple id that the given user belongs to.
 *
 * Cached for 5 minutes; invalidated by the `COUPLE_MEMBERS` cache tag.
 *
 * @param userId - The signed-in user id.
 * @returns The couple id, or `null` if the user is solo.
 */
export async function getCoupleIdForUser(userId: string): Promise<string | null> {
  return getCoupleIdCached(userId);
}
