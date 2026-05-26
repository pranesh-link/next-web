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
  ArchiveButton,
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
  onArchive: (notifId: string) => void;
};

export default function NotificationCard({
  notif,
  content,
  processingId,
  onCardClick,
  onAccept,
  onDecline,
  onArchive,
}: Props) {
  const hasActions = content.hasActions && content.token && content.inviteId;
  const hasLink = "linkTo" in content && content.linkTo;
  const isClickable: boolean = !!hasLink && !hasActions;

  const handleCardClick = () => {
    if (isClickable) {
      onCardClick(notif.id, notif.read);
    } else if (!hasActions) {
      // Just mark as read if no other action
      if (!notif.read) {
        onCardClick(notif.id, notif.read);
      }
    }
  };

  return (
    <Card
      $unread={!notif.read}
      $clickable={isClickable}
      onClick={handleCardClick}
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

      <ArchiveButton
        onClick={(e) => {
          e.stopPropagation();
          onArchive(notif.id);
        }}
        aria-label="Archive notification"
        title="Archive"
      >
        📥
      </ArchiveButton>

      {hasActions && (
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
    </Card>
  );
}
