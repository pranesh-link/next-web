import prisma from '@/_lib/prisma';
import { getUserIdsForCouple } from '@/_services/finance/couple-service';
import { sendPushToUser } from '@/_services/finance/push-service';

/** Maps notification type to a human-readable title for push. */
function getPushTitle(type: string): string {
  const titles: Record<string, string> = {
    COUPLE_INVITE: 'New Couple Invite',
    INCOME_REMINDER: 'Income Reminder',
    BUDGET_ALERT: 'Budget Alert',
    SIP_REMINDER: 'SIP Due Soon',
    DEPOSIT_REMINDER: 'Deposit Due Soon',
    GOAL_REACHED: 'Goal Reached! 🎉',
    LOAN_EMI_REMINDER: 'EMI Due Soon',
  };
  return titles[type] ?? 'LuvVerse Notification';
}

/** Maps notification type to a push body message. */
function getPushBody(type: string): string {
  const bodies: Record<string, string> = {
    COUPLE_INVITE: 'You have a new couple invite waiting.',
    INCOME_REMINDER: 'Don\'t forget to log last month\'s income.',
    BUDGET_ALERT: 'You\'re close to exceeding your budget.',
    SIP_REMINDER: 'Your SIP payment is due in the next few days.',
    DEPOSIT_REMINDER: 'A deposit installment is due soon.',
    GOAL_REACHED: 'Congratulations! You\'ve reached your savings goal.',
    LOAN_EMI_REMINDER: 'Your loan EMI is due in the next few days.',
  };
  return bodies[type] ?? 'You have a new notification.';
}

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

/**
 * Check if user has logged any INCOME transactions for the previous month.
 * If not, create an INCOME_REMINDER notification (deduped by featureId = "YYYY-MM").
 * Returns { created, month } where month is the display name (e.g. "February 2026").
 */
export async function syncIncomeReminder(userId: string) {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

  const monthName = prevMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Check if reminder already exists for this month
  const existing = await prisma.notification.findFirst({
    where: { userId, type: 'INCOME_REMINDER', featureId: monthKey },
  });

  if (existing) {
    // Return unread status so popup can show for existing unread reminders
    return { created: false, month: monthName, unread: !existing.read };
  }

  // Check if user (or couple partner) has any INCOME transactions in the previous month
  const coupleUserIds = await getUserIdsForCouple(userId);
  const startOfMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
  const endOfMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59, 999);

  const incomeCount = await prisma.transaction.count({
    where: {
      userId: { in: coupleUserIds },
      type: 'INCOME',
      date: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  if (incomeCount > 0) {
    return { created: false, month: monthName, unread: false };
  }

  // No income logged — create the reminder
  await createNotification(userId, 'INCOME_REMINDER', monthKey);
  return { created: true, month: monthName, unread: true };
}
