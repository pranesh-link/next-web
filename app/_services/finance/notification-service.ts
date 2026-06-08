import { db } from "@db";
import { notifications, coupleInvites, transactions } from "@db/schema";
import { eq, and, lt, inArray } from "drizzle-orm";
import { getUserIdsForCouple } from "@/_services/finance/couple-service";
import { sendPushToUser } from "@/_services/finance/push-service";

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
    const existing = await db.query.notifications.findFirst({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.type, type),
        eq(notifications.featureId, featureId)
      ),
    });
    if (existing) return existing;
  }

  const [notification] = await db
    .insert(notifications)
    .values({ userId, type, featureId: featureId ?? null })
    .returning();

  // Fire-and-forget push notification
  sendPushToUser(userId, getPushTitle(type), getPushBody(type), {
    type,
    featureId: featureId ?? '',
    notificationId: notification.id,
  }).catch(() => {});

  return notification;
}

export async function getNotificationsForUser(userId: string, includeArchived = false) {
  return db.query.notifications.findMany({
    where: includeArchived
      ? eq(notifications.userId, userId)
      : and(eq(notifications.userId, userId), eq(notifications.archived, false)),
    orderBy: (n, { desc }) => [desc(n.createdAt)],
    limit: 50,
  });
}

export async function getUnreadCount(userId: string) {
  const rows = await db.query.notifications.findMany({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.read, false),
      eq(notifications.archived, false)
    ),
    columns: { id: true },
  });
  return rows.length;
}

export async function markAsRead(notificationId: string, userId: string) {
  const existing = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
  });
  if (!existing) throw new Error('Notification not found');

  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId))
    .returning();
  return updated;
}

export async function markAsUnread(notificationId: string, userId: string) {
  const existing = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
  });
  if (!existing) throw new Error('Notification not found');

  const [updated] = await db
    .update(notifications)
    .set({ read: false })
    .where(eq(notifications.id, notificationId))
    .returning();
  return updated;
}

export async function markAllAsRead(userId: string) {
  return db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

export async function archiveNotification(notificationId: string, userId: string) {
  const existing = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
  });
  if (!existing) throw new Error('Notification not found');

  const [updated] = await db
    .update(notifications)
    .set({ archived: true, archivedAt: new Date() })
    .where(eq(notifications.id, notificationId))
    .returning();
  return updated;
}

export async function unarchiveNotification(notificationId: string, userId: string) {
  const existing = await db.query.notifications.findFirst({
    where: and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
  });
  if (!existing) throw new Error('Notification not found');

  const [updated] = await db
    .update(notifications)
    .set({ archived: false, archivedAt: null })
    .where(eq(notifications.id, notificationId))
    .returning();
  return updated;
}

export async function archiveAllRead(userId: string) {
  return db
    .update(notifications)
    .set({ archived: true, archivedAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.read, true),
        eq(notifications.archived, false)
      )
    );
}

export async function getArchivedNotifications(userId: string) {
  return db.query.notifications.findMany({
    where: and(eq(notifications.userId, userId), eq(notifications.archived, true)),
    orderBy: (n, { desc }) => [desc(n.archivedAt)],
    limit: 50,
  });
}

/**
 * Auto-archive read notifications older than 30 days.
 * Called during sync or as a cron-like background task.
 */
export async function autoArchiveOldNotifications(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .update(notifications)
    .set({ archived: true, archivedAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.read, true),
        eq(notifications.archived, false),
        lt(notifications.createdAt, thirtyDaysAgo)
      )
    );

  return { archivedCount: result.rowCount ?? 0 };
}

/**
 * Backfill: Create notifications for PENDING CoupleInvites that
 * don't already have a corresponding Notification row.
 */
export async function syncMissingInviteNotifications(
  userId: string,
  email: string
) {
  const pendingInvites = await db.query.coupleInvites.findMany({
    where: and(
      eq(coupleInvites.email, email),
      eq(coupleInvites.status, 'PENDING')
    ),
    columns: { id: true },
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
  const existing = await db.query.notifications.findFirst({
    where: and(
      eq(notifications.userId, userId),
      eq(notifications.type, 'INCOME_REMINDER'),
      eq(notifications.featureId, monthKey)
    ),
  });

  if (existing) {
    // Return unread status so popup can show for existing unread reminders
    return { created: false, month: monthName, unread: !existing.read };
  }

  // Check if user (or couple partner) has any INCOME transactions in the previous month
  const coupleUserIds = await getUserIdsForCouple(userId);
  const startOfMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1);
  const endOfMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0, 23, 59, 59, 999);

  const incomeCount = await db.query.transactions.findMany({
    where: and(
      inArray(transactions.userId, coupleUserIds),
      eq(transactions.type, 'INCOME')
    ),
    columns: { date: true },
  });

  const hasIncome = incomeCount.some((t) => {
    const d = new Date(t.date!);
    return d >= startOfMonth && d <= endOfMonth;
  });

  if (hasIncome) {
    return { created: false, month: monthName, unread: false };
  }

  // No income logged — create the reminder
  await createNotification(userId, 'INCOME_REMINDER', monthKey);
  return { created: true, month: monthName, unread: true };
}
