"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  getMyNotifications,
  getMyUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  syncNotifications,
} from "@/finance/_actions/notifications";

type NotificationItem = NonNullable<
  Extract<
    Awaited<ReturnType<typeof getMyNotifications>>,
    { success: true }
  >["data"]
>[number];

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const POLL_INTERVAL = 60_000;

export function NotificationProvider({
  children,
  hasUser,
}: {
  children: React.ReactNode;
  hasUser: boolean;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hasUserRef = useRef(hasUser);
  const fetchingRef = useRef(false);
  const syncedRef = useRef(false);

  hasUserRef.current = hasUser;

  const refresh = useCallback(async () => {
    if (!hasUserRef.current || fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const [notifRes, countRes] = await Promise.all([
        getMyNotifications(),
        getMyUnreadCount(),
      ]);
      if (notifRes.success) setNotifications(notifRes.data ?? []);
      if (countRes.success) setUnreadCount(countRes.data ?? 0);
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!hasUser) return;

    // Backfill sync only once per session
    if (!syncedRef.current) {
      syncedRef.current = true;
      syncNotifications().then(() => refresh());
    } else {
      refresh();
    }

    intervalRef.current = setInterval(refresh, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasUser, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    []
  );

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
