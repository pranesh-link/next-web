import prisma from '@/_lib/prisma';
import { createNotification } from '@/_services/finance/notification-service';
import { sendSilentPushToUser } from '@/_services/finance/push-service';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/_lib/cache';

/**
 * Invite a partner to join an existing couple by email.
 *
 * Also fans out an in-app `COUPLE_INVITE` notification to the invited
 * user if they already have an account.
 *
 * @param coupleId - The couple to invite into.
 * @param email - Email address of the invitee.
 * @param invitedByUserId - The user id sending the invite (must be a member).
 * @returns The created invite row.
 * @throws {Error} when the couple is missing, the inviter is not a member,
 * the couple is full, or an invite to this email already exists.
 */
export async function invitePartner(
  coupleId: string,
  email: string,
  invitedByUserId: string,
) {
  const couple = await prisma.couple.findUnique({
    where: { id: coupleId },
    include: {
      members: true,
      invites: { where: { status: 'PENDING' } },
    },
  });

  if (!couple) throw new Error('Couple not found');
  if (!couple.members.some((m) => m.userId === invitedByUserId))
    throw new Error('Not a member of this couple');
  if (couple.members.length >= 2)
    throw new Error('Couple already has two members');
  if (couple.invites.some((i) => i.email === email))
    throw new Error('Invite already sent to this email');

  const invite = await prisma.coupleInvite.create({
    data: { coupleId, email, invitedBy: invitedByUserId },
  });

  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (invitedUser) {
    await createNotification(invitedUser.id, 'COUPLE_INVITE', invite.id);
  }

  return invite;
}

/**
 * Accept a pending invite by its primary id.
 *
 * @param inviteId - Invite primary key.
 * @param userId - The user id accepting the invite.
 * @returns The created `CoupleMember` row.
 * @throws {Error} when the invite is missing/non-pending, the couple is
 * full, or the user is already in another couple.
 */
export async function acceptInvite(inviteId: string, userId: string) {
  const invite = await prisma.coupleInvite.findUnique({
    where: { id: inviteId },
    include: { couple: { include: { members: true } } },
  });

  if (!invite) throw new Error('Invite not found');
  if (invite.status !== 'PENDING')
    throw new Error('Invite is no longer pending');
  if (invite.couple.members.length >= 2)
    throw new Error('Couple already has two members');

  const existing = await prisma.coupleMember.findFirst({ where: { userId } });
  if (existing) throw new Error('You are already in a couple');

  const [member] = await prisma.$transaction([
    prisma.coupleMember.create({
      data: { coupleId: invite.coupleId, userId, role: 'PARTNER' },
    }),
    prisma.coupleInvite.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED' },
    }),
  ]);

  revalidateTag(CACHE_TAGS.COUPLE_MEMBERS);

  // Notify the couple owner that their partner has joined (silent push — triggers E2E key bootstrap)
  const ownerId = invite.couple.members[0]?.userId;
  if (ownerId) {
    sendSilentPushToUser(
      ownerId,
      { type: 'COUPLE_FORMED', coupleId: invite.coupleId },
    ).catch(() => {});
  }

  return member;
}

/**
 * Cancel a pending invite. The caller must be a member of the couple
 * that issued the invite.
 *
 * @param inviteId - Invite primary key.
 * @param userId - The signed-in user id (must be a couple member).
 * @returns `{ success: true }` on completion.
 * @throws {Error} when the invite is missing/non-pending or the user is
 * not authorized.
 */
export async function cancelInvite(inviteId: string, userId: string) {
  const invite = await prisma.coupleInvite.findUnique({
    where: { id: inviteId },
    include: { couple: { include: { members: true } } },
  });

  if (!invite) throw new Error('Invite not found');
  if (invite.status !== 'PENDING')
    throw new Error('Invite is no longer pending');
  if (!invite.couple.members.some((m) => m.userId === userId))
    throw new Error('Not authorized to cancel this invite');

  await prisma.coupleInvite.update({
    where: { id: inviteId },
    data: { status: 'CANCELLED' },
  });

  return { success: true };
}

/**
 * Accept a pending invite by its public token.
 *
 * Validates that the signed-in user's email matches the invite email.
 *
 * @param token - The invite token from the invite link.
 * @param userId - The signed-in user id.
 * @returns The created `CoupleMember` row.
 * @throws {Error} when the invite is missing/non-pending, the couple is
 * full, the user is not found, the email does not match, or the user is
 * already in another couple.
 */
export async function acceptInviteByToken(token: string, userId: string) {
  const invite = await prisma.coupleInvite.findUnique({
    where: { token },
    include: { couple: { include: { members: true } } },
  });

  if (!invite) throw new Error('Invite not found');
  if (invite.status !== 'PENDING')
    throw new Error('Invite is no longer pending');
  if (invite.couple.members.length >= 2)
    throw new Error('Couple already has two members');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.email !== invite.email)
    throw new Error('This invite was sent to a different email address');

  const existing = await prisma.coupleMember.findFirst({ where: { userId } });
  if (existing) throw new Error('You are already in a couple');

  const [member] = await prisma.$transaction([
    prisma.coupleMember.create({
      data: { coupleId: invite.coupleId, userId, role: 'PARTNER' },
    }),
    prisma.coupleInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    }),
  ]);

  revalidateTag(CACHE_TAGS.COUPLE_MEMBERS);

  // Notify the couple owner that their partner has joined (silent push — triggers E2E key bootstrap)
  const ownerId = invite.couple.members[0]?.userId;
  if (ownerId) {
    sendSilentPushToUser(
      ownerId,
      { type: 'COUPLE_FORMED', coupleId: invite.coupleId },
    ).catch(() => {});
  }

  return member;
}

/**
 * Look up an invite (and its couple/members) by public token.
 *
 * @param token - The invite token from the invite link.
 * @returns The invite row, or `null` if not found.
 */
export async function getInviteByToken(token: string) {
  return prisma.coupleInvite.findUnique({
    where: { token },
    include: {
      couple: {
        include: {
          members: {
            include: {
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

/**
 * List all `PENDING` invites addressed to the given email.
 *
 * @param email - Email address of the invitee.
 * @returns Pending invites ordered newest-first.
 */
export async function getPendingInvitesForUser(email: string) {
  return prisma.coupleInvite.findMany({
    where: { email, status: 'PENDING' },
    include: {
      couple: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Decline a pending invite addressed to the given email.
 *
 * @param inviteId - Invite primary key.
 * @param userEmail - The signed-in user's email (must match the invite).
 * @returns `{ success: true }` on completion.
 * @throws {Error} when the invite is missing/non-pending or the email
 * does not match.
 */
export async function declineInvite(inviteId: string, userEmail: string) {
  const invite = await prisma.coupleInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite) throw new Error('Invite not found');
  if (invite.status !== 'PENDING') throw new Error('Invite is no longer pending');
  if (invite.email !== userEmail) throw new Error('Not authorized to decline this invite');

  await prisma.coupleInvite.update({
    where: { id: inviteId },
    data: { status: 'DECLINED' },
  });

  return { success: true };
}
