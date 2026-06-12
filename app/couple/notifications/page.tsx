"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/couple/_components/notifications/NotificationProvider";
import { acceptInviteByToken, declineInviteAction, getMyPendingInvites } from "@/couple/finance/_actions/couples";
import { archiveNotification, archiveAllRead, unarchiveNotification } from "@/couple/finance/_actions/notifications";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import {
  PageWrapper,
  PageHeader,
  PageTitle,
  RefreshButton,
  Content,
  TopBar,
  TopBarLeft,
  FilterToggle,
  FilterOption,
  UnreadBadge,
  ActionButtons,
  MarkAllButton,
  SectionHeader,
  SectionTitle,
  SectionCount,
  NotificationList,
  EmptyMessage,
} from "./_styled";
import NotificationCard from "./_components/NotificationCard";
import Toast from "./_components/Toast";
import { getNotificationContent, type InviteDetail } from "./_utils";

type FilterMode = "all" | "unread";

type DateSection = {
  title: string;
  notifications: Array<{
    id: string;
    type: string;
    read: boolean;
    createdAt: Date | string;
    featureId: string | null;
  }>;
};

function groupNotificationsByDate(
  notificationsList: Array<{
    id: string;
    type: string;
    read: boolean;
    createdAt: Date | string;
    featureId: string | null;
  }>
): DateSection[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const sections: DateSection[] = [
    { title: "Today", notifications: [] },
    { title: "Yesterday", notifications: [] },
    { title: "This Week", notifications: [] },
    { title: "This Month", notifications: [] },
    { title: "Older", notifications: [] },
  ];

  for (const notif of notificationsList) {
    const createdAt = new Date(notif.createdAt);
    if (createdAt >= today) {
      sections[0].notifications.push(notif);
    } else if (createdAt >= yesterday) {
      sections[1].notifications.push(notif);
    } else if (createdAt >= weekAgo) {
      sections[2].notifications.push(notif);
    } else if (createdAt >= monthAgo) {
      sections[3].notifications.push(notif);
    } else {
      sections[4].notifications.push(notif);
    }
  }

  return sections.filter((section) => section.notifications.length > 0);
}

export default function NotificationsPage() {
  const { notifications, unreadCount, refresh, markRead, markUnread, markAllRead } =
    useNotifications();
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [archivingAll, setArchivingAll] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<Record<string, InviteDetail>>({});
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [toast, setToast] = useState<{ message: string; show: boolean; undoId?: string }>({
    message: "",
    show: false,
  });
  const fetchedIdsRef = useRef<Set<string>>(new Set());

  // Filter notifications based on mode
  const filteredNotifications = useMemo(() => {
    if (filterMode === "unread") {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, filterMode]);

  // Group notifications by date
  const groupedNotifications = useMemo(
    () => groupNotificationsByDate(filteredNotifications),
    [filteredNotifications]
  );

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
          const inviter = invite.couple?.members?.find(() => true);
          details[invite.id] = {
            id: invite.id,
            token: (invite as typeof invite & { token: string }).token,
            status: (invite as typeof invite & { status: string }).status,
            coupleName: invite.couple?.name || null,
            inviterName: inviter?.user?.name || null,
          };
        }
        setInviteDetails((prev) => ({ ...prev, ...details }));
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [notifications]);

  // Refresh when page regains visibility (e.g. after back-swipe from linked page)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [refresh]);

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
    await refresh();
    setMarkingAll(false);
    setToast({ message: "All notifications marked as read", show: true });
  }, [markAllRead, refresh]);

  const handleArchiveAllRead = useCallback(async () => {
    setArchivingAll(true);
    const res = await archiveAllRead();
    if (res.success) {
      await refresh();
      setToast({ message: "All read notifications archived", show: true });
    }
    setArchivingAll(false);
  }, [refresh]);

  const handleArchive = useCallback(
    async (notifId: string) => {
      const res = await archiveNotification(notifId);
      if (res.success) {
        await refresh();
        setToast({ message: "Notification archived", show: true, undoId: notifId });
      }
    },
    [refresh]
  );

  const handleUndoArchive = useCallback(async () => {
    const id = toast.undoId;
    if (!id) return;
    setToast((prev) => ({ ...prev, show: false }));
    const res = await unarchiveNotification(id);
    if (res.success) {
      await refresh();
    }
  }, [toast.undoId, refresh]);

  const handleCardClick = useCallback(
    async (notifId: string, isRead: boolean) => {
      // Find the notification and its content
      const notif = notifications.find((n) => n.id === notifId);
      if (!notif) return;

      const content = getNotificationContent(notif, inviteDetails);

      // Mark as read first (always, if not already read)
      if (!isRead) {
        await markRead(notifId);
      }

      // Then navigate if it has a linkTo
      if ("linkTo" in content && content.linkTo) {
        router.push(content.linkTo as string);
      }
    },
    [notifications, inviteDetails, markRead, router]
  );

  const handleMarkUnread = useCallback(
    async (notifId: string) => {
      await markUnread(notifId);
    },
    [markUnread]
  );

  const readCount = notifications.filter((n) => n.read).length;

  if (loading && notifications.length === 0) {
    return (
      <PageWrapper>
        <PageHeader>
          <PageTitle>Notifications</PageTitle>
          <RefreshButton onClick={refresh}>↻</RefreshButton>
        </PageHeader>
        <Content>
          <LoadingSkeleton type="card" count={3} />
        </Content>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Notifications</PageTitle>
        <RefreshButton onClick={refresh}>↻</RefreshButton>
      </PageHeader>
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
              <TopBarLeft>
                <FilterToggle>
                  <FilterOption
                    $active={filterMode === "all"}
                    onClick={() => setFilterMode("all")}
                  >
                    All
                  </FilterOption>
                  <FilterOption
                    $active={filterMode === "unread"}
                    onClick={() => setFilterMode("unread")}
                  >
                    Unread
                  </FilterOption>
                </FilterToggle>
                {unreadCount > 0 && (
                  <UnreadBadge>{unreadCount} unread</UnreadBadge>
                )}
              </TopBarLeft>

              <ActionButtons>
                {unreadCount > 0 && (
                  <MarkAllButton
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                  >
                    {markingAll ? "Marking…" : "Mark all as read"}
                  </MarkAllButton>
                )}
                {readCount > 0 && (
                  <MarkAllButton
                    onClick={handleArchiveAllRead}
                    disabled={archivingAll}
                  >
                    {archivingAll ? "Archiving…" : "Archive all read"}
                  </MarkAllButton>
                )}
              </ActionButtons>
            </TopBar>

            {filteredNotifications.length === 0 ? (
              <EmptyMessage>
                {filterMode === "unread"
                  ? "No unread notifications"
                  : "All caught up!"}
              </EmptyMessage>
            ) : (
              groupedNotifications.map((section) => (
                <div key={section.title}>
                  <SectionHeader>
                    <SectionTitle>{section.title}</SectionTitle>
                    <SectionCount>{section.notifications.length}</SectionCount>
                  </SectionHeader>
                  <NotificationList>
                    {section.notifications.map((notif) => {
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
                          onArchive={handleArchive}
                          onMarkUnread={handleMarkUnread}
                        />
                      );
                    })}
                  </NotificationList>
                </div>
              ))
            )}
          </>
        )}
      </Content>

      <Toast
        message={toast.message}
        show={toast.show}
        onUndo={toast.undoId ? handleUndoArchive : undefined}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </PageWrapper>
  );
}
