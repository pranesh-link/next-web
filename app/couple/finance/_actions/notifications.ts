'use server';

import { requireAuthForAction } from '@/_lib/auth-utils';
import { syncDepositReminders } from '@/couple/finance/_actions/deposits';
import { syncInvestmentReminders } from '@/couple/finance/_actions/investments';
import {
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  syncMissingInviteNotifications,
  syncIncomeReminder as syncIncomeReminderService,
  archiveNotification as archiveNotificationService,
  unarchiveNotification as unarchiveNotificationService,
  archiveAllRead as archiveAllReadService,
  getArchivedNotifications,
} from '@/_services/finance/notification-service';

export async function getMyNotifications() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const notifications = await getNotificationsForUser(user.id);
    return { success: true as const, data: notifications };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to get notifications';
    return { success: false as const, error: message };
  }
}

export async function getMyNotificationsSnapshot() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotificationsForUser(user.id),
      getUnreadCount(user.id),
    ]);

    return {
      success: true as const,
      data: { notifications, unreadCount },
    };
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : 'Failed to get notifications snapshot';
    return { success: false as const, error: message };
  }
}

export async function syncNotifications() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const inviteSyncTask = user.email
      ? syncMissingInviteNotifications(user.id, user.email)
      : Promise.resolve();

    const [_, depositReminders, investmentReminders, incomeReminder] = await Promise.all([
      inviteSyncTask,
      syncDepositReminders(user.id),
      syncInvestmentReminders(user.id),
      syncIncomeReminderService(user.id),
    ]);

    return {
      success: true as const,
      data: {
        depositReminders,
        investmentReminders,
        incomeReminder,
      },
    };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to sync notifications';
    return { success: false as const, error: message };
  }
}

export async function getMyUnreadCount() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const count = await getUnreadCount(user.id);
    return { success: true as const, data: count };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to get unread count';
    return { success: false as const, error: message };
  }
}

export async function markNotificationRead(notificationId: string) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await markAsRead(notificationId, user.id);
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to mark as read';
    return { success: false as const, error: message };
  }
}

export async function markAllNotificationsRead() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await markAllAsRead(user.id);
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to mark all as read';
    return { success: false as const, error: message };
  }
}

export async function syncIncomeReminderAction() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const result = await syncIncomeReminderService(user.id);
    return { success: true as const, data: result };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to sync income reminder';
    return { success: false as const, error: message };
  }
}

export async function archiveNotification(notificationId: string) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await archiveNotificationService(notificationId, user.id);
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to archive notification';
    return { success: false as const, error: message };
  }
}

export async function unarchiveNotification(notificationId: string) {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await unarchiveNotificationService(notificationId, user.id);
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to unarchive notification';
    return { success: false as const, error: message };
  }
}

export async function archiveAllRead() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    await archiveAllReadService(user.id);
    return { success: true as const, data: null };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to archive all read';
    return { success: false as const, error: message };
  }
}

export async function getMyArchivedNotifications() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    const archived = await getArchivedNotifications(user.id);
    return { success: true as const, data: archived };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to get archived notifications';
    return { success: false as const, error: message };
  }
}
