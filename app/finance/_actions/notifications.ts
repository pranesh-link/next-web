'use server';

import { requireAuthForAction } from '@/_lib/auth-utils';
import {
  getNotificationsForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  syncMissingInviteNotifications,
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

export async function syncNotifications() {
  const user = await requireAuthForAction();
  if (!user) return { success: false as const, error: 'Not authenticated' };

  try {
    if (user.email) {
      await syncMissingInviteNotifications(user.id, user.email);
    }
    return { success: true as const, data: null };
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
