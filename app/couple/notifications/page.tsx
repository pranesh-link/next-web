"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import { useNotifications } from "@/couple/_components/notifications/NotificationProvider";
import { acceptInviteByToken, declineInviteAction, getMyPendingInvites } from "@/couple/finance/_actions/couples";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ── Styled Components ── */

const PageWrapper = styled.div`
  min-height: 100vh;
  background: var(--bg);
`;

const Content = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 20px;

  @media (max-width: 480px) {
    padding: 16px 12px;
  }
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const UnreadBadge = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface);
  padding: 4px 12px;
  border-radius: 12px;
`;

const MarkAllButton = styled.button`
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
  background: none;
  border: none;
  font-family: inherit;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ${EASING};

  &:hover {
    background: rgba(59, 130, 246, 0.08);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NotificationCard = styled.div<{ $unread: boolean }>`
  background: ${(p) => (p.$unread ? "var(--bg-elevated)" : "var(--bg)")};
  border: 1px solid ${(p) => (p.$unread ? "var(--accent)" : "var(--border)")};
  border-left: 3px solid ${(p) => (p.$unread ? "var(--accent)" : "transparent")};
  border-radius: 12px;
  padding: 16px 20px;
  transition: all 0.2s ${EASING};
  cursor: pointer;

  &:hover {
    background: var(--surface);
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

const IconCircle = styled.div<{ $type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  background: ${(p) =>
    p.$type === "COUPLE_INVITE"
      ? "rgba(59, 130, 246, 0.12)"
      : p.$type === "INCOME_REMINDER"
      ? "rgba(251, 191, 36, 0.15)"
      : "var(--surface)"};
`;

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const CardTitle = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 2px;
  line-height: 1.4;
`;

const CardMeta = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
`;

const ReadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
  margin-top: 6px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-left: 52px;

  @media (max-width: 480px) {
    padding-left: 0;
  }
`;

const ActionButton = styled.button<{ $variant: "accept" | "decline" }>`
  padding: 8px 20px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  background: ${(p) =>
    p.$variant === "accept" ? "#3b82f6" : "var(--surface)"};
  color: ${(p) =>
    p.$variant === "accept" ? "#ffffff" : "var(--text-muted)"};

  &:hover:not(:disabled) {
    background: ${(p) =>
      p.$variant === "accept" ? "#2563eb" : "var(--surface-hover)"};
    color: ${(p) =>
      p.$variant === "accept" ? "#ffffff" : "var(--text)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── Invite detail cache ── */

type InviteDetail = {
  id: string;
  token: string;
  status: string;
  coupleName: string | null;
  inviterName: string | null;
};

/* ── Component ── */

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
      await declineInviteAction(inviteId);
      await markRead(notifId);
      await refresh();
      setProcessingId(null);
    },
    [markRead, refresh]
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

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  };

  const getNotificationContent = (notif: (typeof notifications)[number]) => {
    if (notif.type === "COUPLE_INVITE" && notif.featureId) {
      const detail = inviteDetails[notif.featureId];
      const inviterName = detail?.inviterName || "Someone";
      const groupName = detail?.coupleName || "their group";
      return {
        icon: "👥",
        title: `${inviterName} invited you to join ${groupName}`,
        meta: "Partner invite",
        hasActions: detail?.status === "PENDING",
        token: detail?.token,
        inviteId: detail?.id,
      };
    }
    if (notif.type === "INCOME_REMINDER" && notif.featureId) {
      const [year, monthNum] = notif.featureId.split("-");
      const monthName = new Date(Number(year), Number(monthNum) - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
      return {
        icon: "💰",
        title: `Record your income for ${monthName}`,
        meta: "Income reminder",
        hasActions: false,
        token: undefined,
        inviteId: undefined,
        linkTo: "/couple/finance/accounts?addIncome=true",
      };
    }
    if (notif.type === "INVESTMENT_SIP_REMINDER") {
      return {
        icon: "📈",
        title: "SIP installment is due",
        meta: "Investment reminder",
        hasActions: false,
        token: undefined,
        inviteId: undefined,
        linkTo: "/couple/finance/investments",
      };
    }
    if (notif.type === "DEPOSIT_MATURITY_REMINDER") {
      return {
        icon: "🏦",
        title: "A deposit is nearing maturity",
        meta: "Deposit reminder",
        hasActions: false,
        token: undefined,
        inviteId: undefined,
        linkTo: "/couple/finance/deposits",
      };
    }
    if (notif.type === "DEPOSIT_INSTALLMENT_REMINDER") {
      return {
        icon: "🗓️",
        title: "Recurring deposit installment is due",
        meta: "Deposit reminder",
        hasActions: false,
        token: undefined,
        inviteId: undefined,
        linkTo: "/couple/finance/deposits",
      };
    }
    return {
      icon: "🔔",
      title: "New notification",
      meta: notif.type,
      hasActions: false,
      token: undefined,
      inviteId: undefined,
    };
  };

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
                const content = getNotificationContent(notif);
                return (
                  <NotificationCard
                    key={notif.id}
                    $unread={!notif.read}
                    onClick={() => handleCardClick(notif.id, notif.read)}
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
                            handleDecline(content.inviteId!, notif.id);
                          }}
                        >
                          Decline
                        </ActionButton>
                        <ActionButton
                          $variant="accept"
                          disabled={processingId === notif.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAccept(content.token!, notif.id);
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
                            markRead(notif.id);
                            router.push(content.linkTo as string);
                          }}
                        >
                          Add Income
                        </ActionButton>
                      </ActionRow>
                    )}
                  </NotificationCard>
                );
              })}
            </NotificationList>
          </>
        )}
      </Content>
    </PageWrapper>
  );
}
