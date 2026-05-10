"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import { useNotifications } from "@/couple/_components/notifications/NotificationProvider";
import { acceptInviteByToken, declineInviteAction, getMyPendingInvites } from "@/couple/finance/_actions/couples";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import {
  PageWrapper,
  Content,
  TopBar,
  UnreadBadge,
  MarkAllButton,
  NotificationList,
} from "./_styled";
import NotificationCard from "./_components/NotificationCard";
import { getNotificationContent, type InviteDetail } from "./_utils";

export default function NotificationsPage() {
  const { notifications, unreadCount, refresh, markRead, markAllRead } =
    useNotifications();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<Record<string, InviteDetail>>({});
  const [loading, setLoading] = useState(true);
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  // Fetch invite details for COUPLE_INVITE notifications (only for new IDs)
  useEffect(() => {
    const inviteNotifs = notifications.filter(
      (n) =>
        n.type === "COUPLE_INVITE" &&
        n.featureId &&
        !fetchedIdsRef.current.has(n.featureId)
    );

    if (inviteNotifs.length === 0) {
      setLoading(false);
      return;
    }

    // Mark as fetched immediately to prevent re-fetching
    for (const n of inviteNotifs) {
      fetchedIdsRef.current.add(n.featureId!);
    }

    let cancelled = false;
    getMyPendingInvites().then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        const details: Record<string, InviteDetail> = {};
        for (const invite of res.data) {
          const inviter = invite.couple.members.find(() => true);
          details[invite.id] = {
            id: invite.id,
            token: (invite as typeof invite & { token: string }).token,
            status: (invite as typeof invite & { status: string }).status,
            coupleName: invite.couple.name || null,
            inviterName: inviter?.user.name || null,
          };
        }
        setInviteDetails((prev) => ({ ...prev, ...details }));
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [notifications]);

  const handleAccept = useCallback(
    async (token: string, notifId: string) => {
      setProcessingId(notifId);
      const res = await acceptInviteByToken(token);
      if (res.success) {
        router.push("/couple/details");
        void markRead(notifId);
      }
      setProcessingId(null);
    },
    [markRead, router]
  );

  const handleDecline = useCallback(
    async (inviteId: string, notifId: string) => {
      setProcessingId(notifId);
      const res = await declineInviteAction(inviteId);
      if (res.success) {
        setInviteDetails((prev) => {
          const current = prev[inviteId];
          if (!current) return prev;
          return {
            ...prev,
            [inviteId]: { ...current, status: "DECLINED" },
          };
        });
        await markRead(notifId);
      }
      setProcessingId(null);
    },
    [markRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    await markAllRead();
    setMarkingAll(false);
  }, [markAllRead]);

  const handleCardClick = useCallback(
    async (notifId: string, isRead: boolean) => {
      if (!isRead) {
        await markRead(notifId);
      }
    },
    [markRead]
  );

  const handleLink = useCallback(
    (notifId: string, linkTo: string) => {
      markRead(notifId);
      router.push(linkTo);
    },
    [markRead, router]
  );

  if (loading && notifications.length === 0) {
    return (
      <PageWrapper>
        <FinanceHeader title="Notifications" onRefresh={refresh} />
        <Content>
          <LoadingSkeleton type="card" count={3} />
        </Content>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <FinanceHeader title="Notifications" onRefresh={refresh} />
      <Content>
        {notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="No notifications"
            description="You're all caught up! Notifications about partner invites and other updates will appear here."
          />
        ) : (
          <>
            <TopBar>
              {unreadCount > 0 ? (
                <UnreadBadge>{unreadCount} unread</UnreadBadge>
              ) : (
                <span />
              )}
              {unreadCount > 0 && (
                <MarkAllButton
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                >
                  {markingAll ? "Marking…" : "Mark all as read"}
                </MarkAllButton>
              )}
            </TopBar>

            <NotificationList>
              {notifications.map((notif) => {
                const content = getNotificationContent(notif, inviteDetails);
                return (
                  <NotificationCard
                    key={notif.id}
                    notif={notif}
                    content={content}
                    processingId={processingId}
                    onCardClick={handleCardClick}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onLink={handleLink}
                  />
                );
              })}
            </NotificationList>
          </>
        )}
      </Content>
    </PageWrapper>
  );
}
