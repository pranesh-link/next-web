import prisma from '@/_lib/prisma';

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

export async function getUserIdsForCouple(
  userId: string
): Promise<string[]> {
  const membership = await prisma.coupleMember.findFirst({
    where: { userId },
    include: { couple: { include: { members: true } } },
  });

  if (!membership) return [userId];
  return membership.couple.members.map((m) => m.userId);
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
