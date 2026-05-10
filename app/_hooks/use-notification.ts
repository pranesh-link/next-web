"use client";

import { useCallback, useRef, useState } from "react";
import { NOTIFICATION_TIMINGS } from "@/couple/_constants/animation";

/**
 * Toast notification payload.
 */
export type Notification = {
  message: string;
  type: "success" | "error";
};

/**
 * Signature of the {@link useNotification} `notify` setter.
 */
export type Notify = (message: string, type: "success" | "error") => void;

/**
 * Return shape of the {@link useNotification} hook.
 */
export type UseNotificationReturn = {
  notification: Notification | null;
  notifLeaving: boolean;
  notify: Notify;
};

/**
 * Manage a transient toast notification with fade-out animation.
 *
 * Auto-dismisses after {@link NOTIFICATION_TIMINGS.displayMs}, triggering a
 * {@link NOTIFICATION_TIMINGS.fadeOutMs} leave animation before clearing.
 * Cancels prior timers when a new notification fires so rapid calls don't stack.
 *
 * @returns Bag with current `notification`, `notifLeaving` flag, and `notify` setter.
 *
 * @example
 * ```tsx
 * const { notification, notifLeaving, notify } = useNotification();
 * notify("Saved", "success");
 * ```
 */
export function useNotification(): UseNotificationReturn {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [notifLeaving, setNotifLeaving] = useState(false);
  const notifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback<Notify>((message, type) => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotifLeaving(false);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => {
      setNotifLeaving(true);
      setTimeout(() => setNotification(null), NOTIFICATION_TIMINGS.fadeOutMs);
    }, NOTIFICATION_TIMINGS.displayMs);
  }, []);

  return { notification, notifLeaving, notify };
}
