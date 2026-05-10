"use client";

import { NotificationBanner } from "../_styled";
import type { Notification } from "../_utils";

type Props = {
  notification: Notification | null;
  leaving: boolean;
};

export default function NotificationToast({ notification, leaving }: Props) {
  if (!notification) return null;
  return (
    <NotificationBanner $type={notification.type} $leaving={leaving}>
      {notification.message}
    </NotificationBanner>
  );
}
