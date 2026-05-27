import prisma from '@/_lib/prisma';
import { getUserIdsForCouple } from '@/_services/finance/couple-service';
import { sendPushToUser } from '@/_services/finance/push-service';

/**
 * Whitelist of allowed notification types.
 * Only COUPLE_INVITE and BUDGET_ALERT notifications are permitted.
 * All other notification creation requests will be silently ignored.
 */
const ALLOWED_NOTIFICATION_TYPES = new Set([
  'COUPLE_INVITE',
  'BUDGET_ALERT',
  'PUSH_BUDGET_ALERT',
]);

/** Maps notification type to a human-readable title for push. */
function getPushTitle(type: string): string {
  const titles: Record<string, string> = {
    COUPLE_INVITE: 'New Couple Invite',
    BUDGET_ALERT: 'Budget Alert',
    PUSH_BUDGET_ALERT: 'Budget Alert',
  };
  return titles[type] ?? 'LuvVerse Notification';
}

/** Maps notification type to a push body message. */
function getPushBody(type: string): string {
  const bodies: Record<string, string> = {
    COUPLE_INVITE: 'You have a new couple invite waiting.',
    BUDGET_ALERT: 'You\'re close to exceeding your budget.',
    PUSH_BUDGET_ALERT: 'You\'re close to exceeding your budget.',
  };
  return bodies[type] ?? 'You have a new notification.';
}

export async function createNotification(
  userId: string,
  type: string,
  featureId?: string
) {
  // Filter: only whitelisted notification types are created
  if (!ALLOWED_NOTIFICATION_TYPES.has(type)) {
    console.log(
      `[Notifications] Type '${type}' is not whitelisted. Ignoring notification creation.`
    );
    return null;
  }

  // Dedup: don't create if one already exists for this type+featureId
  if (featureId) {
    const existing = await prisma.notification.findFirst({
      where: { userId, type, featureId },
    });
    if (existing) return existing;
  }

  const notification = await prisma.notification.create({
    data: { userId, type, featureId },
  });

  // Fire-and-forget push notification
  sendPushToUser(userId, getPushTitle(type), getPushBody(type), {
    type,
    featureId: featureId ?? '',
    notificationId: notification.id,
  }).catch(() => {});

  return notification;
}

export async function getNotificationsForUser(userId: string, includeArchived = false) {
  return prisma.notification.findMany({
    where: includeArchived ? { userId } : { userId, archived: false },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false, archived: false },
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

export async function markAsUnread(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new Error('Notification not found');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: false },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function archiveNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new Error('Notification not found');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { archived: true, archivedAt: new Date() },
  });
}

export async function unarchiveNotification(notificationId: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw new Error('Notification not found');

  return prisma.notification.update({
    where: { id: notificationId },
    data: { archived: false, archivedAt: null },
  });
}

export async function archiveAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: true, archived: false },
    data: { archived: true, archivedAt: new Date() },
  });
}

export async function getArchivedNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, archived: true },
    orderBy: { archivedAt: 'desc' },
    take: 50,
  });
}

/**
 * Auto-archive read notifications older than 30 days.
 * Called during sync or as a cron-like background task.
 */
export async function autoArchiveOldNotifications(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: true,
      archived: false,
      createdAt: { lt: thirtyDaysAgo },
    },
    data: { archived: true, archivedAt: new Date() },
  });

  return { archivedCount: result.count };
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
