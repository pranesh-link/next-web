"use client";

import {
  NotificationCard as Card,
  CardTop,
  IconCircle,
  CardInfo,
  CardTitle,
  CardMeta,
  ReadDot,
  ActionRow,
  ActionButton,
} from "../_styled";
import { formatTime, type NotificationContent } from "../_utils";

export type NotificationItemShape = {
  id: string;
  type: string;
  read: boolean;
  createdAt: Date | string;
  featureId: string | null;
};

type Props = {
  notif: NotificationItemShape;
  content: NotificationContent;
  processingId: string | null;
  onCardClick: (notifId: string, isRead: boolean) => void;
  onAccept: (token: string, notifId: string) => void;
  onDecline: (inviteId: string, notifId: string) => void;
  onLink: (notifId: string, linkTo: string) => void;
};

export default function NotificationCard({
  notif,
  content,
  processingId,
  onCardClick,
  onAccept,
  onDecline,
  onLink,
}: Props) {
  return (
    <Card
      $unread={!notif.read}
      onClick={() => onCardClick(notif.id, notif.read)}
    >
      <CardTop>
        <IconCircle $type={notif.type}>{content.icon}</IconCircle>
        <CardInfo>
          <CardTitle>{content.title}</CardTitle>
          <CardMeta>
            {content.meta} · {formatTime(notif.createdAt)}
          </CardMeta>
        </CardInfo>
        {!notif.read && <ReadDot />}
      </CardTop>

      {content.hasActions && content.token && content.inviteId && (
        <ActionRow>
          <ActionButton
            $variant="decline"
            disabled={processingId === notif.id}
            onClick={(e) => {
              e.stopPropagation();
              onDecline(content.inviteId!, notif.id);
            }}
          >
            Decline
          </ActionButton>
          <ActionButton
            $variant="accept"
            disabled={processingId === notif.id}
            onClick={(e) => {
              e.stopPropagation();
              onAccept(content.token!, notif.id);
            }}
          >
            {processingId === notif.id ? "Accepting…" : "Accept"}
          </ActionButton>
        </ActionRow>
      )}

      {"linkTo" in content && content.linkTo && (
        <ActionRow>
          <ActionButton
            $variant="accept"
            onClick={(e) => {
              e.stopPropagation();
              onLink(notif.id, content.linkTo as string);
            }}
          >
            Add Income
          </ActionButton>
        </ActionRow>
      )}
    </Card>
  );
}
