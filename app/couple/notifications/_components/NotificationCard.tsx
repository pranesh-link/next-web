"use client";

import { useCallback, useRef, useState } from "react";
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
  ActionSheetOverlay,
  ActionSheetContainer,
  ActionSheetHandle,
  ActionSheetItem,
  ActionSheetDivider,
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
  onMarkUnread: (notifId: string) => void;
};

const LONG_PRESS_MS = 500;

export default function NotificationCard({
  notif,
  content,
  processingId,
  onCardClick,
  onAccept,
  onDecline,
  onArchive,
  onMarkUnread,
}: Props) {
  const [showSheet, setShowSheet] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  const hasActions = content.hasActions && content.token && content.inviteId;
  const hasLink = "linkTo" in content && content.linkTo;
  const isClickable: boolean = !!hasLink && !hasActions;

  const startPress = useCallback(() => {
    didLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      didLongPressRef.current = true;
      setShowSheet(true);
    }, LONG_PRESS_MS);
  }, []);

  const cancelPress = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleCardClick = () => {
    if (didLongPressRef.current) return; // long-press consumed
    if (isClickable) {
      onCardClick(notif.id, notif.read);
    } else if (!hasActions && !notif.read) {
      onCardClick(notif.id, notif.read);
    }
  };

  const handleToggleRead = () => {
    setShowSheet(false);
    if (notif.read) {
      onMarkUnread(notif.id);
    } else {
      onCardClick(notif.id, notif.read);
    }
  };

  const handleArchiveFromSheet = () => {
    setShowSheet(false);
    onArchive(notif.id);
  };

  return (
    <>
      <Card
        $unread={!notif.read}
        $clickable={isClickable}
        onClick={handleCardClick}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
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

      {showSheet && (
        <ActionSheetOverlay onClick={() => setShowSheet(false)}>
          <ActionSheetContainer onClick={(e) => e.stopPropagation()}>
            <ActionSheetHandle />
            <ActionSheetItem onClick={handleToggleRead}>
              {notif.read ? "✉️  Mark as unread" : "✅  Mark as read"}
            </ActionSheetItem>
            <ActionSheetDivider />
            <ActionSheetItem $danger onClick={handleArchiveFromSheet}>
              📥  Archive
            </ActionSheetItem>
          </ActionSheetContainer>
        </ActionSheetOverlay>
      )}
    </>
  );
}
