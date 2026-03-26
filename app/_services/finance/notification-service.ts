import prisma from '@/_lib/prisma';

export async function createNotification(
  userId: string,
  type: string,
  featureId?: string
) {
  // Dedup: don't create if one already exists for this type+featureId
  if (featureId) {
    const existing = await prisma.notification.findFirst({
      where: { userId, type, featureId },
    });
    if (existing) return existing;
  }

  return prisma.notification.create({
    data: { userId, type, featureId },
  });
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new Error('Notification not found');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/**
 * Backfill: Create notifications for PENDING CoupleInvites that
 * don't already have a corresponding Notification row.
 */
export async function syncMissingInviteNotifications(
  userId: string,
  email: string
) {
  const pendingInvites = await prisma.coupleInvite.findMany({
    where: { email, status: 'PENDING' },
    select: { id: true },
  });

  for (const invite of pendingInvites) {
    await createNotification(userId, 'COUPLE_INVITE', invite.id);
  }
}
