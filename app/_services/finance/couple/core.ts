import prisma from '@/_lib/prisma';
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
  const couple = await prisma.couple.create({
    data: {
      name: name || null,
      members: {
        create: { userId, role: 'OWNER' },
      },
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      },
    },
  });
  revalidateTag(CACHE_TAGS.COUPLE_MEMBERS);
  return couple;
}

/**
 * Get the couple the given user belongs to, including members and
 * pending invites.
 *
 * @param userId - The signed-in user id.
 * @returns The couple record (with members + pending invites) or `null`.
 */
export async function getCoupleForUser(userId: string) {
  const membership = await prisma.coupleMember.findFirst({
    where: { userId },
    include: {
      couple: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
          invites: {
            where: { status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  });
  return membership?.couple ?? null;
}

/**
 * List members of a couple in join-order.
 *
 * @param coupleId - The couple id.
 * @returns Members with their user `id`, `name`, `email`, `image`.
 */
export async function getCoupleMembers(coupleId: string) {
  return prisma.coupleMember.findMany({
    where: { coupleId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: { joinedAt: 'asc' },
  });
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
  const membership = await prisma.coupleMember.findFirst({
    where: { userId },
  });
  if (!membership) throw new Error('Not in a couple');

  await prisma.coupleMember.delete({ where: { id: membership.id } });

  const remaining = await prisma.coupleMember.count({
    where: { coupleId: membership.coupleId },
  });
  if (remaining === 0) {
    await prisma.couple.delete({ where: { id: membership.coupleId } });
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
  const membership = await prisma.coupleMember.findFirst({
    where: { userId },
  });
  if (!membership) throw new Error('Not in a couple');

  const couple = await prisma.couple.update({
    where: { id: membership.coupleId },
    data: { name: newName || null },
  });
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
  const membership = await prisma.coupleMember.findFirst({
    where: { userId },
  });
  if (!membership) throw new Error('Not in a couple');

  await prisma.couple.delete({ where: { id: membership.coupleId } });

  revalidateTag(CACHE_TAGS.COUPLE_MEMBERS);

  return { success: true };
}
