import prisma from '@/_lib/prisma';
import { unstable_cache } from 'next/cache';
import { createNotification } from '@/_services/finance/notification-service';
import { CACHE_TAGS } from '@/_lib/cache';

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
  return couple;
}

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

export async function invitePartner(
  coupleId: string,
  email: string,
  invitedByUserId: string
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

  // Create notification for the invited user if they have an account
  const invitedUser = await prisma.user.findUnique({ where: { email } });
  if (invitedUser) {
    await createNotification(invitedUser.id, 'COUPLE_INVITE', invite.id);
  }

  return invite;
}

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

  return member;
}

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

const getCoupleUserIdsCached = unstable_cache(
  async (userId: string) => {
    const membership = await prisma.coupleMember.findFirst({
      where: { userId },
      include: { couple: { include: { members: true } } },
    });
    if (!membership) return [userId];
    return membership.couple.members.map((m) => m.userId);
  },
  ["couple-user-ids"],
  { revalidate: 300, tags: [CACHE_TAGS.COUPLE_MEMBERS] },
);

export async function getUserIdsForCouple(
  userId: string
): Promise<string[]> {
  return getCoupleUserIdsCached(userId);
}

const getCoupleIdCached = unstable_cache(
  async (userId: string) => {
    const membership = await prisma.coupleMember.findFirst({
      where: { userId },
      select: { coupleId: true },
    });
    return membership?.coupleId ?? null;
  },
  ["couple-id-for-user"],
  { revalidate: 300, tags: [CACHE_TAGS.COUPLE_MEMBERS] },
);

export async function getCoupleIdForUser(
  userId: string
): Promise<string | null> {
  return getCoupleIdCached(userId);
}

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

  return member;
}

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

  return { success: true };
}

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

export async function disbandCouple(userId: string) {
  const membership = await prisma.coupleMember.findFirst({
    where: { userId },
  });
  if (!membership) throw new Error('Not in a couple');

  // Cascade deletes all CoupleMember and CoupleInvite records
  await prisma.couple.delete({ where: { id: membership.coupleId } });

  return { success: true };
}

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
