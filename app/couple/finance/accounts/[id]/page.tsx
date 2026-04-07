"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import ReactSelect, { StylesConfig } from "react-select";
import {
  getAccount,
  updateAccountBalance,
  deleteAccount,
  getAccountActivity,
  updateAccount,
  togglePinAccount,
  setEmergencyFundAccount,
  unsetEmergencyFundAccount,
} from "@/couple/finance/_actions/accounts";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import Modal from "@/couple/_components/shared/Modal";

/* ── Types ──────────────────────────────────────────── */

type Account = {
  id: string;
  name: string;
  nickname: string | null;
  type: string;
  balance: number;
  isEmergencyFund: boolean;
  isPinned: boolean;
  isSalaryAccount: boolean;
  userId: string;
  user: { id: string; name: string | null };
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ActivityItem = {
  id: string;
  date: string | Date;
  source: "balance" | "transaction";
  amount: number;
  change: number;
  balance: number;
  note: string | null;
  description: string | null;
  category: string | null;
  type: string | null;
};

type ActivityFilter = "all" | "balance" | "transaction";

type Notification = { message: string; type: "success" | "error" };

/* ── Helpers ────────────────────────────────────────── */

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(d: string | Date): string {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeIcon(type: string): string {
  switch (type) {
    case "SAVINGS_ACCOUNT": return "🏦";
    case "CREDIT_ACCOUNT": return "🏧";
    case "CREDIT_CARD": return "💳";
    case "RECURRING_DEPOSIT": return "🔄";
    case "FIXED_DEPOSIT": return "🔒";
    default: return "💰";
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "SAVINGS_ACCOUNT": return "Savings Account";
    case "CREDIT_ACCOUNT": return "Credit Account";
    case "CREDIT_CARD": return "Credit Card";
    case "RECURRING_DEPOSIT": return "Recurring Deposit";
    case "FIXED_DEPOSIT": return "Fixed Deposit";
    default: return type;
  }
}

/* ── Keyframes ──────────────────────────────────────── */

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Styled Components ──────────────────────────────── */

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

const NotificationBanner = styled.div<{
  $type: "success" | "error";
  $leaving: boolean;
}>`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: ${(p) =>
    p.$type === "success"
      ? "rgba(34, 197, 94, 0.15)"
      : "rgba(239, 68, 68, 0.15)"};
  border: 1px solid
    ${(p) =>
      p.$type === "success"
        ? "rgba(34, 197, 94, 0.3)"
        : "rgba(239, 68, 68, 0.3)"};
  color: ${(p) => (p.$type === "success" ? "#16a34a" : "#dc2626")};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(12px);
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  padding: 0;
  border: none;
  background: none;
  color: var(--text-muted);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ${EASING};

  &:hover {
    color: var(--accent);
  }
`;

/* ── Account Header Card ── */

const AccountHeader = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.3s ${EASING};

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const AccountTop = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    gap: 12px;
  }
`;

const IconCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
`;

const AccountMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const AccountName = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AccountType = styled.div`
  font-size: 13px;
  color: var(--text-muted);
`;

const BalanceDisplay = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 26px;
  }
`;

const BalanceSub = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  flex-wrap: wrap;
`;

/* ── Sections ── */

const Section = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  animation: ${fadeIn} 0.3s ${EASING};

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const SectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
`;

const SmallButton = styled.button<{ $variant?: "danger" | "primary" }>`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  white-space: nowrap;
  background: ${(p) =>
    p.$variant === "danger"
      ? "rgba(239, 68, 68, 0.1)"
      : p.$variant === "primary"
        ? "var(--accent)"
        : "var(--surface)"};
  color: ${(p) =>
    p.$variant === "danger"
      ? "#ef4444"
      : p.$variant === "primary"
        ? "#ffffff"
        : "var(--text)"};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── History Timeline ── */

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 480px) {
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const HistoryDot = styled.div<{ $positive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => (p.$positive ? "#22c55e" : "#ef4444")};
  flex-shrink: 0;
`;

const HistoryInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const HistoryChange = styled.span<{ $positive: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => (p.$positive ? "#22c55e" : "#ef4444")};
`;

const HistoryBalance = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
`;

const HistoryDate = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
`;

const EmptyHistory = styled.div`
  text-align: center;
  padding: 24px;
  font-size: 14px;
  color: var(--text-muted);
`;

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  &:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── Filter Tabs ── */

const FilterTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  background: var(--surface);
  border-radius: 10px;
  padding: 3px;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  background: ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : "var(--text-muted)")};

  &:hover:not(:disabled) {
    background: ${(p) => (p.$active ? "var(--accent)" : "rgba(0,0,0,0.04)")};
  }
`;

const SourceBadge = styled.span<{ $source: "balance" | "transaction" }>`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${(p) =>
    p.$source === "balance"
      ? "rgba(59, 130, 246, 0.1)"
      : "rgba(168, 85, 247, 0.1)"};
  color: ${(p) =>
    p.$source === "balance" ? "#3b82f6" : "#a855f7"};
  flex-shrink: 0;
`;

const EmergencyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #16a34a;
  background: rgba(34, 197, 94, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
`;

const NicknameBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
`;

const HeaderBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const PinToggle = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  color: var(--text-muted);

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
`;

const ActivityDescription = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
`;

/* ── Delete Confirm ── */

const DangerZone = styled.div`
  background: var(--bg-elevated);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 16px;
  }
`;

const DangerText = styled.div`
  font-size: 13px;
  color: var(--text-muted);
`;

/* ── Edit Modal ── */

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
`;

type SelectOption = { value: string; label: string };

const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    borderRadius: 8,
    border: `1px solid ${state.isFocused ? "#3b82f6" : "rgba(0,0,0,0.10)"}`,
    background: "#f8fafc",
    fontFamily: "inherit",
    fontSize: 14,
    boxShadow: "none",
    minHeight: 42,
    cursor: "pointer",
    "&:hover": { borderColor: "#3b82f6" },
  }),
  singleValue: (base) => ({ ...base, color: "#1a1a2e" }),
  menu: (base) => ({
    ...base,
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 8,
    zIndex: 9999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 14,
    cursor: "pointer",
    background: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "rgba(0,0,0,0.03)"
        : "transparent",
    color: state.isSelected ? "#fff" : "#1a1a2e",
    "&:active": { background: "rgba(0,0,0,0.03)" },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "#94a3b8", padding: "0 8px" }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  input: (base) => ({ ...base, color: "#1a1a2e" }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

const accountTypeOptions: SelectOption[] = [
  { value: "SAVINGS_ACCOUNT", label: "🏦 Savings Account" },
  { value: "CREDIT_ACCOUNT", label: "🏧 Credit Account" },
  { value: "CREDIT_CARD", label: "💳 Credit Card" },
  { value: "RECURRING_DEPOSIT", label: "🔄 Recurring Deposit" },
  { value: "FIXED_DEPOSIT", label: "🔒 Fixed Deposit" },
];

const ModalInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
`;

const ErrorText = styled.p`
  color: #ef4444;
  font-size: 13px;
  margin: 8px 0 0;
`;

const NotFoundWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  gap: 12px;
`;

const NotFoundIcon = styled.div`
  font-size: 48px;
`;

const NotFoundTitle = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
`;

const NotFoundSub = styled.div`
  font-size: 14px;
  color: var(--text-muted);
`;

/* ── Component ──────────────────────────────────────── */

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  // Balance update
  const [newBalance, setNewBalance] = useState("");
  const [balanceNote, setBalanceNote] = useState("");

  // Activity with pagination
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");

  // Update balance modal
  const [showUpdateBalance, setShowUpdateBalance] = useState(false);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editError, setEditError] = useState("");

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Notification
  const [notification, setNotification] = useState<Notification | null>(null);
  const [notifLeaving, setNotifLeaving] = useState(false);
  const notifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((message: string, type: "success" | "error") => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotifLeaving(false);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => {
      setNotifLeaving(true);
      setTimeout(() => setNotification(null), 300);
    }, 3000);
  }, []);

  const fetchAccount = useCallback(async () => {
    const res = await getAccount(id);
    if (res.success) {
      setAccount(res.data as Account);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [id]);

  const fetchActivity = useCallback(
    async (cursor?: string) => {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setActivityLoading(true);
      }
      const res = await getAccountActivity(id, cursor);
      if (res.success) {
        const { items, nextCursor: nc } = res.data;
        if (cursor) {
          setActivityItems((prev) => [...prev, ...(items as ActivityItem[])]);
        } else {
          setActivityItems(items as ActivityItem[]);
        }
        setNextCursor(nc);
      }
      setActivityLoading(false);
      setLoadingMore(false);
    },
    [id],
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchAccount(), fetchActivity()]);
  }, [fetchAccount, fetchActivity]);

  useEffect(() => {
    fetchAccount();
    fetchActivity();
  }, [fetchAccount, fetchActivity]);

  const handleUpdateBalance = async () => {
    const parsed = parseFloat(newBalance);
    if (isNaN(parsed)) {
      notify("Enter a valid balance", "error");
      return;
    }
    setSaving(true);
    const res = await updateAccountBalance(id, parsed, balanceNote.trim() || undefined);
    if (res.success) {
      notify("Balance updated!", "success");
      setNewBalance("");
      setBalanceNote("");
      setShowUpdateBalance(false);
      await refreshAll();
    } else {
      notify(res.error, "error");
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    setSaving(true);
    setEditError("");
    const res = await updateAccount(id, {
      name: editName.trim(),
      nickname: editNickname.trim() || undefined,
      type: editType,
    });
    if (res.success) {
      notify("Account updated!", "success");
      setShowEdit(false);
      await fetchAccount();
    } else {
      setEditError(res.error);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setSaving(true);
    const res = await deleteAccount(id);
    if (res.success) {
      notify("Account deleted", "success");
      setTimeout(() => router.push("/couple/finance/accounts"), 500);
    } else {
      notify(res.error, "error");
      setSaving(false);
    }
  };

  const handleTogglePin = async () => {
    const res = await togglePinAccount(id);
    if (res.success) {
      notify(account?.isPinned ? "Unpinned" : "Pinned!", "success");
      await fetchAccount();
    } else {
      notify(res.error, "error");
    }
  };

  const handleToggleEmergency = async () => {
    if (!account) return;
    const res = account.isEmergencyFund
      ? await unsetEmergencyFundAccount(id)
      : await setEmergencyFundAccount(id);
    if (res.success) {
      notify(account.isEmergencyFund ? "Emergency fund removed" : "Marked as emergency fund!", "success");
      await fetchAccount();
    } else {
      notify(res.error, "error");
    }
  };

  const filteredActivity = activityItems.filter(
    (item) => activityFilter === "all" || item.source === activityFilter
  );

  const openEditModal = () => {
    if (!account) return;
    setEditName(account.name);
    setEditNickname(account.nickname || "");
    setEditType(account.type);
    setEditError("");
    setShowEdit(true);
  };

  if (loading) {
    return (
      <PageWrapper>
        <FinanceHeader title="Account" onRefresh={refreshAll} />
        <Content>
          <LoadingSkeleton type="card" count={2} />
        </Content>
      </PageWrapper>
    );
  }

  if (notFound || !account) {
    return (
      <PageWrapper>
        <FinanceHeader title="Account" />
        <Content>
          <NotFoundWrapper>
            <NotFoundIcon>🔍</NotFoundIcon>
            <NotFoundTitle>Account not found</NotFoundTitle>
            <NotFoundSub>
              This account doesn&apos;t exist or you don&apos;t have access.
            </NotFoundSub>
            <SmallButton
              $variant="primary"
              onClick={() => router.push("/couple/finance/accounts")}
            >
              Back to Accounts
            </SmallButton>
          </NotFoundWrapper>
        </Content>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <FinanceHeader title={account.name} onRefresh={refreshAll} />

      {notification && (
        <NotificationBanner $type={notification.type} $leaving={notifLeaving}>
          {notification.message}
        </NotificationBanner>
      )}

      <Content>
        <BackLink onClick={() => router.push("/couple/finance/accounts")}>
          ← All Accounts
        </BackLink>

        {/* ── Account Info ── */}
        <AccountHeader>
          <AccountTop>
            <IconCircle>{typeIcon(account.type)}</IconCircle>
            <AccountMeta>
              <AccountName>{account.name}</AccountName>
              <AccountType>
                {typeLabel(account.type)} · {account.user?.name ?? "You"}
              </AccountType>
              <HeaderBadges>
                {account.nickname && (
                  <NicknameBadge>{account.nickname}</NicknameBadge>
                )}
                {account.isEmergencyFund && (
                  <EmergencyBadge>🛡️ Emergency Fund</EmergencyBadge>
                )}
                {account.isPinned && (
                  <SourceBadge $source="balance">📌 Pinned</SourceBadge>
                )}
              </HeaderBadges>
            </AccountMeta>
          </AccountTop>
          <BalanceDisplay>{formatCurrency(account.balance)}</BalanceDisplay>
          <BalanceSub>Updated {formatDate(account.updatedAt)}</BalanceSub>
          <HeaderActions>
            <SmallButton onClick={openEditModal}>Edit</SmallButton>
            <SmallButton $variant="primary" onClick={() => setShowUpdateBalance(true)}>Update Balance</SmallButton>
            <PinToggle onClick={handleTogglePin}>
              {account.isPinned ? "📌 Unpin" : "📌 Pin"}
            </PinToggle>
            <SmallButton onClick={handleToggleEmergency}>
              {account.isEmergencyFund ? "🛡️ Remove Emergency" : "🛡️ Emergency Fund"}
            </SmallButton>
          </HeaderActions>
        </AccountHeader>

        {/* ── Account Activity ── */}
        <Section>
          <SectionTitle>Account Activity</SectionTitle>
          <FilterTabs>
            <FilterTab $active={activityFilter === "all"} onClick={() => setActivityFilter("all")}>
              All
            </FilterTab>
            <FilterTab $active={activityFilter === "balance"} onClick={() => setActivityFilter("balance")}>
              Balance Updates
            </FilterTab>
            <FilterTab $active={activityFilter === "transaction"} onClick={() => setActivityFilter("transaction")}>
              Transactions
            </FilterTab>
          </FilterTabs>
          {activityLoading ? (
            <EmptyHistory>Loading…</EmptyHistory>
          ) : filteredActivity.length === 0 ? (
            <EmptyHistory>
              {activityFilter === "all" ? "No activity yet" : `No ${activityFilter === "balance" ? "balance updates" : "transactions"} yet`}
            </EmptyHistory>
          ) : (
            <>
              <Timeline>
                {filteredActivity.map((item) => (
                  <HistoryItem key={`${item.source}-${item.id}`}>
                    <HistoryDot $positive={item.change >= 0} />
                    <HistoryInfo>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <SourceBadge $source={item.source}>
                          {item.source === "balance" ? "Balance" : "Txn"}
                        </SourceBadge>
                        <HistoryChange $positive={item.change >= 0}>
                          {item.change >= 0 ? "+" : ""}
                          {formatCurrency(item.change)}
                        </HistoryChange>
                      </div>
                      {item.note && <ActivityDescription>{item.note}</ActivityDescription>}
                      {item.description && (
                        <ActivityDescription>
                          {item.description}{item.category ? ` · ${item.category}` : ""}
                        </ActivityDescription>
                      )}
                    </HistoryInfo>
                    {item.source === "balance" && item.balance > 0 && (
                      <HistoryBalance>{formatCurrency(item.balance)}</HistoryBalance>
                    )}
                    <HistoryDate>{formatDateTime(item.date)}</HistoryDate>
                  </HistoryItem>
                ))}
              </Timeline>
              {nextCursor && (
                <LoadMoreButton
                  disabled={loadingMore}
                  onClick={() => fetchActivity(nextCursor)}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </LoadMoreButton>
              )}
            </>
          )}
        </Section>

        {/* ── Danger Zone ── */}
        <DangerZone>
          <DangerText>
            Permanently delete this account and all its balance history.
          </DangerText>
          {confirmDelete ? (
            <div style={{ display: "flex", gap: 8 }}>
              <SmallButton onClick={() => setConfirmDelete(false)}>
                Cancel
              </SmallButton>
              <SmallButton
                $variant="danger"
                disabled={saving}
                onClick={handleDelete}
              >
                {saving ? "Deleting…" : "Confirm Delete"}
              </SmallButton>
            </div>
          ) : (
            <SmallButton
              $variant="danger"
              onClick={() => setConfirmDelete(true)}
            >
              Delete Account
            </SmallButton>
          )}
        </DangerZone>
      </Content>

      {/* ── Update Balance Modal ── */}
      <Modal
        isOpen={showUpdateBalance}
        onClose={() => {
          setShowUpdateBalance(false);
          setNewBalance("");
          setBalanceNote("");
        }}
        title="Update Balance"
        size="sm"
      >
        <FormGroup>
          <Label>New Balance</Label>
          <ModalInput
            type="number"
            placeholder="Enter new balance"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>Note (optional)</Label>
          <ModalInput
            type="text"
            placeholder="e.g. Salary credited"
            value={balanceNote}
            onChange={(e) => setBalanceNote(e.target.value)}
          />
        </FormGroup>
        <ModalActions>
          <SmallButton
            onClick={() => {
              setShowUpdateBalance(false);
              setNewBalance("");
              setBalanceNote("");
            }}
          >
            Cancel
          </SmallButton>
          <SmallButton
            $variant="primary"
            disabled={saving || !newBalance}
            onClick={handleUpdateBalance}
          >
            {saving ? "Saving…" : "Update"}
          </SmallButton>
        </ModalActions>
      </Modal>

      {/* ── Edit Account Modal ── */}
      <Modal
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false);
          setEditError("");
        }}
        title="Edit Account"
        size="sm"
      >
        <FormGroup>
          <Label>Account Name</Label>
          <ModalInput
            placeholder="e.g. HDFC Savings"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>Nickname (optional)</Label>
          <ModalInput
            placeholder="e.g. Main, Joint"
            value={editNickname}
            onChange={(e) => setEditNickname(e.target.value)}
            maxLength={50}
          />
        </FormGroup>
        <FormGroup>
          <Label>Account Type</Label>
          <ReactSelect<SelectOption>
            options={accountTypeOptions}
            value={accountTypeOptions.find((o) => o.value === editType)}
            onChange={(opt) => setEditType(opt?.value ?? "SAVINGS_ACCOUNT")}
            styles={selectStyles}
            isSearchable={false}
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
          />
        </FormGroup>
        {editError && <ErrorText>{editError}</ErrorText>}
        <ModalActions>
          <SmallButton
            onClick={() => {
              setShowEdit(false);
              setEditError("");
            }}
          >
            Cancel
          </SmallButton>
          <SmallButton
            $variant="primary"
            disabled={saving || !editName.trim()}
            onClick={handleEdit}
          >
            {saving ? "Saving…" : "Save"}
          </SmallButton>
        </ModalActions>
      </Modal>
    </PageWrapper>
  );
}
