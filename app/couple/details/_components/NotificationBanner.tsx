"use client";

import { NotificationBannerEl } from "../_styled";
import type { Notification } from "../_types";

type Props = {
  notification: Notification;
  leaving: boolean;
};

export default function NotificationBanner({ notification, leaving }: Props) {
  return (
    <NotificationBannerEl $type={notification.type} $leaving={leaving}>
      {notification.message}
    </NotificationBannerEl>
  );
}
