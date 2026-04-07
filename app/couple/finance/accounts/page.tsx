"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import ReactSelect, { StylesConfig } from "react-select";
import {
  createAccount,
  togglePinAccount,
  getAccountsPageData,
  updateAccount,
  updateAccountBalance,
  getOverallBalanceHistory,
} from "@/couple/finance/_actions/accounts";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import Modal from "@/couple/_components/shared/Modal";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import AddIncomeModal from "@/couple/_components/shared/AddIncomeModal";

/* ── Types ──────────────────────────────────────────── */

type CoupleUser = { id: string; name: string | null; email: string };

type Account = {
  id: string;
  name: string;
  nickname: string | null;
  type: string;
  balance: number;
  isSalaryAccount: boolean;
  isEmergencyFund: boolean;
  isPinned: boolean;
  userId: string;
  user: { id: string; name: string | null };
  createdAt: string | Date;
  updatedAt: string | Date;
};

type Notification = { message: string; type: "success" | "error" };

type BalanceLogItem = {
  id: string;
  accountName: string;
  reason: "ACCOUNT_ADDED" | "ACCOUNT_REMOVED" | "BALANCE_UPDATED";
  change: number;
  totalBalance: number;
  createdAt: string | Date;
};

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
  max-width: 960px;
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

/* ── Total Balance Header ── */

const TotalBar = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 16px;
  }
`;

const TotalLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
`;

const TotalAmount = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const AddButton = styled.button`
  padding: 10px 20px;
  border-radius: 10px;
  border: none;
  background: var(--accent);
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  white-space: nowrap;

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ── Account Cards ── */

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  animation: ${fadeIn} 0.3s ${EASING};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AccountCard = styled.div`
  position: relative;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ${EASING};
  cursor: pointer;

  &:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
`;

const CardHeader = styled.div`
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
`;

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 28px;
`;

const CardNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const CardName = styled.div`
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const CardType = styled.div`
  font-size: 11px;
  letter-spacing: 0.2px;
  color: var(--text-muted);
  text-transform: uppercase;
  opacity: 0.85;
`;

const CardBalance = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  margin-top: 2px;
`;

const CardMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
`;

const CardMetaLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const CardUpdated = styled.div`
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
  opacity: 0.72;
`;

const CardChevron = styled.div`
  color: var(--text-muted);
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.55;
`;

/* ── Modal Form ── */

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
];

const TypeDisplay = styled.div`
  min-height: 42px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.10);
  background: #f8fafc;
  color: #1a1a2e;
  font-family: inherit;
  font-size: 14px;
  display: flex;
  align-items: center;
`;

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

const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  white-space: nowrap;
  background: ${(p) => (p.$primary ? "var(--accent)" : "var(--surface)")};
  color: ${(p) => (p.$primary ? "#ffffff" : "var(--text)")};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
`;

const CheckboxLabel = styled.label`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
`;

const WarningAlert = styled.div`
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #b45309;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 16px;
`;

const SalaryBadge = styled.span`
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #92400e;
  background: rgba(251, 191, 36, 0.11);
  padding: 1px 5px;
  border-radius: 4px;
`;

const EmergencyBadge = styled.span`
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #047857;
  background: rgba(16, 185, 129, 0.11);
  padding: 1px 5px;
  border-radius: 4px;
`;

const NicknameBadge = styled.span`
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #6366f1;
  background: rgba(99, 102, 241, 0.11);
  padding: 1px 5px;
  border-radius: 4px;
`;

const PinButton = styled.button<{ $pinned: boolean }>`
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px;
  border-radius: 8px;
  border: none;
  background: ${(p) => (p.$pinned ? "rgba(59, 130, 246, 0.14)" : "transparent")};
  cursor: pointer;
  font-size: 13px;
  opacity: ${(p) => (p.$pinned ? 1 : 0.55)};
  transition: all 0.15s ${EASING};
  z-index: 2;

  &:hover {
    opacity: 1;
    transform: scale(1.08);
    background: rgba(59, 130, 246, 0.14);
  }
`;

const AddIncomeBtn = styled.button`
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  background: rgba(251, 191, 36, 0.08);
  color: #b45309;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  &:hover {
    background: rgba(251, 191, 36, 0.15);
  }
`;

const OwnerText = styled.div`
  font-size: 10px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.78;
`;

const PinnedCard = styled(AccountCard)`
  border-color: rgba(59, 130, 246, 0.3);
`;

/* ── Balance History Section ── */

const HistorySection = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  margin-bottom: 24px;
  overflow: hidden;
`;

const HistoryToggle = styled.button`
  width: 100%;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: color 0.15s ${EASING};

  &:hover { color: var(--text); }

  @media (max-width: 480px) {
    padding: 14px 16px;
  }
`;

const HistoryList = styled.div`
  padding: 0 24px 16px;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    padding: 0 16px 12px;
  }
`;

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  &:last-child { border-bottom: none; }

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

const HistoryReason = styled.span<{ $reason: string }>`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 6px;
  background: ${(p) =>
    p.$reason === "ACCOUNT_ADDED" ? "rgba(34,197,94,0.1)" :
    p.$reason === "ACCOUNT_REMOVED" ? "rgba(239,68,68,0.1)" :
    "rgba(59,130,246,0.1)"};
  color: ${(p) =>
    p.$reason === "ACCOUNT_ADDED" ? "#16a34a" :
    p.$reason === "ACCOUNT_REMOVED" ? "#ef4444" :
    "#3b82f6"};
`;

const HistoryChange = styled.span<{ $positive: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$positive ? "#22c55e" : "#ef4444")};
`;

const HistoryTotal = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
`;

const HistoryDate = styled.div`
  font-size: 11px;
  color: var(--text-muted);
`;

const HistoryAccountName = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

const LoadMoreBtn = styled.button`
  width: 100%;
  padding: 10px;
  border: none;
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  margin-top: 8px;
  transition: all 0.15s ${EASING};
  &:hover { color: var(--accent); }
`;

/* ── Card Quick Actions ── */

const CardActions = styled.div`
  padding: 0 20px 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const CardActionBtn = styled.button`
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
`;

/* ── Component ──────────────────────────────────────── */

function AccountsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);

  // Couple users for owner selector
  const [coupleUsers, setCoupleUsers] = useState<CoupleUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  // Create form
  const [newName, setNewName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newType, setNewType] = useState("SAVINGS_ACCOUNT");
  const [newBalance, setNewBalance] = useState("");
  const [newIsSalary, setNewIsSalary] = useState(false);
  const [newIsEmergency, setNewIsEmergency] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [createError, setCreateError] = useState("");

  // Balance history
  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<BalanceLogItem[]>([]);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Quick edit modals
  const [editNicknameTarget, setEditNicknameTarget] = useState<Account | null>(null);
  const [editNicknameValue, setEditNicknameValue] = useState("");
  const [updateBalanceTarget, setUpdateBalanceTarget] = useState<Account | null>(null);
  const [updateBalanceValue, setUpdateBalanceValue] = useState("");
  const [updateBalanceNote, setUpdateBalanceNote] = useState("");

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

  const fetchData = useCallback(async () => {
    const pageDataRes = await getAccountsPageData();

    if (pageDataRes.success) {
      setAccounts(pageDataRes.data.accounts as Account[]);
      setTotalBalance(pageDataRes.data.totalBalance);
      setCoupleUsers(pageDataRes.data.coupleUsers as CoupleUser[]);
      setCurrentUserId(pageDataRes.data.currentUserId || "");
      if (!newOwnerId && pageDataRes.data.currentUserId) {
        setNewOwnerId(pageDataRes.data.currentUserId);
      }
    }
    setHistoryItems([]);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchParams.get("addIncome") === "true" && !loading && accounts.length > 0) {
      setShowAddIncome(true);
    }
  }, [searchParams, loading, accounts.length]);

  const prefetchAccountDetail = useCallback((accountId: string) => {
    router.prefetch(`/couple/finance/accounts/${accountId}`);
  }, [router]);

  useEffect(() => {
    if (accounts.length === 0) return;
    // Warm likely next navigations so click transitions feel immediate.
    accounts.slice(0, 8).forEach((acc) => {
      prefetchAccountDetail(acc.id);
    });
  }, [accounts, prefetchAccountDetail]);

  const existingSalaryAccount = accounts.find((a) => a.isSalaryAccount);
  const emergencyFundCount = accounts.filter((a) => a.isEmergencyFund).length;

  const handlePin = async (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    const res = await togglePinAccount(accountId);
    if (res.success) {
      await fetchData();
    } else {
      notify(res.error, "error");
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    setCreateError("");
    const res = await createAccount({
      name: newName.trim(),
      nickname: newNickname.trim() || undefined,
      type: newType,
      balance: parseFloat(newBalance) || 0,
      isSalaryAccount: newIsSalary,
      isEmergencyFund: newIsEmergency,
      ownerId: newOwnerId || currentUserId,
    });
    if (res.success) {
      notify("Account created!", "success");
      setShowCreate(false);
      setNewName("");
      setNewNickname("");
      setNewType("SAVINGS_ACCOUNT");
      setNewBalance("");
      setNewIsSalary(false);
      setNewIsEmergency(false);
      setNewOwnerId(currentUserId);
      await fetchData();
    } else {
      setCreateError(res.error);
    }
    setSaving(false);
  };

  const fetchHistory = useCallback(async (cursor?: string) => {
    setHistoryLoading(true);
    const res = await getOverallBalanceHistory(cursor);
    if (res.success) {
      if (cursor) {
        setHistoryItems((prev) => [...prev, ...res.data.items as BalanceLogItem[]]);
      } else {
        setHistoryItems(res.data.items as BalanceLogItem[]);
      }
      setHistoryCursor(res.data.nextCursor);
    }
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    if (showHistory && historyItems.length === 0) fetchHistory();
  }, [showHistory, historyItems.length, fetchHistory]);

  const handleQuickNickname = async () => {
    if (!editNicknameTarget) return;
    setSaving(true);
    const res = await updateAccount(editNicknameTarget.id, {
      nickname: editNicknameValue.trim() || undefined,
    });
    if (res.success) {
      notify("Nickname updated!", "success");
      setEditNicknameTarget(null);
      await fetchData();
    } else {
      notify(res.error, "error");
    }
    setSaving(false);
  };

  const handleQuickBalance = async () => {
    if (!updateBalanceTarget) return;
    const parsed = parseFloat(updateBalanceValue);
    if (isNaN(parsed)) { notify("Enter a valid balance", "error"); return; }
    setSaving(true);
    const res = await updateAccountBalance(
      updateBalanceTarget.id, parsed, updateBalanceNote.trim() || undefined,
    );
    if (res.success) {
      notify("Balance updated!", "success");
      setUpdateBalanceTarget(null);
      setUpdateBalanceValue("");
      setUpdateBalanceNote("");
      setHistoryItems([]);
      await fetchData();
    } else {
      notify(res.error, "error");
    }
    setSaving(false);
  };

  function reasonLabel(r: string): string {
    switch (r) {
      case "ACCOUNT_ADDED": return "Added";
      case "ACCOUNT_REMOVED": return "Removed";
      case "BALANCE_UPDATED": return "Updated";
      default: return r;
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <FinanceHeader title="Accounts" onRefresh={fetchData} />
        <Content>
          <LoadingSkeleton type="card" count={3} />
        </Content>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <FinanceHeader title="Accounts" onRefresh={fetchData} />

      {notification && (
        <NotificationBanner $type={notification.type} $leaving={notifLeaving}>
          {notification.message}
        </NotificationBanner>
      )}

      <Content>
        {/* ── Total Balance Bar ── */}
        <TotalBar>
          <div>
            <TotalLabel>Total Balance</TotalLabel>
            <TotalAmount>{formatCurrency(totalBalance)}</TotalAmount>
          </div>
          <AddButton onClick={() => {
            setShowCreate(true);
            setNewIsSalary(!existingSalaryAccount);
          }}>+ Add Account</AddButton>
        </TotalBar>

        {/* ── Overall Balance History ── */}
        <HistorySection>
          <HistoryToggle onClick={() => setShowHistory(!showHistory)}>
            Balance History
            <span>{showHistory ? "▲" : "▼"}</span>
          </HistoryToggle>
          {showHistory && (
            <HistoryList>
              {historyLoading && historyItems.length === 0 ? (
                <HistoryDate style={{ textAlign: "center", padding: 16 }}>Loading…</HistoryDate>
              ) : historyItems.length === 0 ? (
                <HistoryDate style={{ textAlign: "center", padding: 16 }}>No history yet</HistoryDate>
              ) : (
                <>
                  {historyItems.map((item) => (
                    <HistoryItem key={item.id}>
                      <HistoryDot $positive={item.change >= 0} />
                      <HistoryInfo>
                        <div>
                          <HistoryReason $reason={item.reason}>
                            {reasonLabel(item.reason)}
                          </HistoryReason>
                          <HistoryChange $positive={item.change >= 0}>
                            {item.change >= 0 ? "+" : ""}{formatCurrency(item.change)}
                          </HistoryChange>
                        </div>
                        <HistoryAccountName>{item.accountName}</HistoryAccountName>
                      </HistoryInfo>
                      <HistoryTotal>{formatCurrency(item.totalBalance)}</HistoryTotal>
                      <HistoryDate>
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </HistoryDate>
                    </HistoryItem>
                  ))}
                  {historyCursor && (
                    <LoadMoreBtn
                      disabled={historyLoading}
                      onClick={() => fetchHistory(historyCursor)}
                    >
                      {historyLoading ? "Loading…" : "Load more"}
                    </LoadMoreBtn>
                  )}
                </>
              )}
            </HistoryList>
          )}
        </HistorySection>

        {/* ── Account Cards ── */}
        {accounts.length === 0 ? (
          <EmptyState
            icon="🏦"
            title="No accounts yet"
            description="Add your first savings account to start tracking balances."
          />
        ) : (
          <CardGrid>
            {accounts.map((acc) => {
              const CardComponent = acc.isPinned ? PinnedCard : AccountCard;
              const ownerName = acc.user?.name || "Unknown";
              const isOwner = acc.userId === currentUserId;
              return (
                <CardComponent
                  key={acc.id}
                  onMouseEnter={() => prefetchAccountDetail(acc.id)}
                  onFocus={() => prefetchAccountDetail(acc.id)}
                  onClick={() => router.push(`/couple/finance/accounts/${acc.id}`)}
                >
                  <PinButton
                    $pinned={acc.isPinned}
                    onClick={(e) => handlePin(e, acc.id)}
                    title={acc.isPinned ? "Unpin" : "Pin to top"}
                  >
                    📌
                  </PinButton>
                  <CardHeader>
                    <CardIcon>{typeIcon(acc.type)}</CardIcon>
                    <CardInfo>
                      <CardNameRow>
                        <CardName>{acc.name}</CardName>
                        {acc.nickname && <NicknameBadge>{acc.nickname}</NicknameBadge>}
                        {acc.isSalaryAccount && <SalaryBadge>Salary</SalaryBadge>}
                        {acc.isEmergencyFund && <EmergencyBadge>🛡️ Emergency</EmergencyBadge>}
                      </CardNameRow>
                      <CardType>{typeLabel(acc.type)}</CardType>
                      <CardBalance>{formatCurrency(acc.balance)}</CardBalance>
                      <CardMetaRow>
                        <CardMetaLeft>
                          <OwnerText>{isOwner ? "You" : ownerName}</OwnerText>
                          <CardUpdated>on {formatDate(acc.updatedAt)}</CardUpdated>
                        </CardMetaLeft>
                        <CardChevron>›</CardChevron>
                      </CardMetaRow>
                    </CardInfo>
                  </CardHeader>
                  <CardActions>
                    {acc.isSalaryAccount && (
                      <AddIncomeBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddIncome(true);
                        }}
                      >
                        💰 Add Income
                      </AddIncomeBtn>
                    )}
                    <CardActionBtn onClick={(e) => {
                      e.stopPropagation();
                      setEditNicknameTarget(acc);
                      setEditNicknameValue(acc.nickname || "");
                    }}>
                      ✏️ Nickname
                    </CardActionBtn>
                    <CardActionBtn onClick={(e) => {
                      e.stopPropagation();
                      setUpdateBalanceTarget(acc);
                      setUpdateBalanceValue(String(acc.balance));
                      setUpdateBalanceNote("");
                    }}>
                      💰 Balance
                    </CardActionBtn>
                  </CardActions>
                </CardComponent>
              );
            })}
          </CardGrid>
        )}
      </Content>

      {/* ── Create Account Modal ── */}
      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCreateError("");
          setNewIsSalary(false);
        }}
        title="Add Account"
        size="sm"
      >
        <FormGroup>
          <Label>Account Name</Label>
          <ModalInput
            placeholder="e.g. HDFC Savings"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>Nickname (optional)</Label>
          <ModalInput
            placeholder="e.g. Main, Joint"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            maxLength={50}
          />
        </FormGroup>
        <FormGroup>
          <Label>Account Type</Label>
          {accountTypeOptions.length === 1 ? (
            <TypeDisplay>{accountTypeOptions[0].label}</TypeDisplay>
          ) : (
            <ReactSelect<SelectOption>
              options={accountTypeOptions}
              value={accountTypeOptions.find((o) => o.value === newType)}
              onChange={(opt) => setNewType(opt?.value ?? "SAVINGS_ACCOUNT")}
              styles={selectStyles}
              isSearchable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
            />
          )}
        </FormGroup>
        {coupleUsers.length > 1 && (
          <FormGroup>
            <Label>Account belongs to</Label>
            <ReactSelect<SelectOption>
              options={coupleUsers.map((u) => ({
                value: u.id,
                label: u.id === currentUserId ? `${u.name || u.email} (You)` : (u.name || u.email),
              }))}
              value={coupleUsers.map((u) => ({
                value: u.id,
                label: u.id === currentUserId ? `${u.name || u.email} (You)` : (u.name || u.email),
              })).find((o) => o.value === newOwnerId)}
              onChange={(opt) => setNewOwnerId(opt?.value ?? currentUserId)}
              styles={selectStyles}
              isSearchable={false}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              menuPosition="fixed"
            />
          </FormGroup>
        )}
        <FormGroup>
          <Label>Opening Balance</Label>
          <ModalInput
            type="number"
            placeholder="0"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
          />
        </FormGroup>
        <CheckboxRow>
          <input
            type="checkbox"
            id="isSalary"
            checked={newIsSalary}
            onChange={(e) => setNewIsSalary(e.target.checked)}
          />
          <CheckboxLabel htmlFor="isSalary">Set as salary account?</CheckboxLabel>
        </CheckboxRow>
        {newIsSalary && existingSalaryAccount && (
          <WarningAlert>
            ⚠️ <strong>{existingSalaryAccount.name}</strong> is currently your salary account. Creating this as salary account will replace it.
          </WarningAlert>
        )}
        <CheckboxRow>
          <input
            type="checkbox"
            id="isEmergency"
            checked={newIsEmergency}
            onChange={(e) => setNewIsEmergency(e.target.checked)}
            disabled={emergencyFundCount >= 2}
          />
          <CheckboxLabel htmlFor="isEmergency">Tag as emergency fund?</CheckboxLabel>
        </CheckboxRow>
        {emergencyFundCount >= 2 && (
          <WarningAlert>
            ⚠️ Maximum 2 emergency fund accounts already tagged.
          </WarningAlert>
        )}
        {createError && <ErrorText>{createError}</ErrorText>}
        <ModalActions>
          <ModalButton
            onClick={() => {
              setShowCreate(false);
              setCreateError("");
              setNewIsSalary(false);
            }}
          >
            Cancel
          </ModalButton>
          <ModalButton
            $primary
            disabled={saving || !newName.trim() || (coupleUsers.length > 1 && !newOwnerId)}
            onClick={handleCreate}
          >
            {saving ? "Creating…" : "Create"}
          </ModalButton>
        </ModalActions>
      </Modal>

      <AddIncomeModal
        isOpen={showAddIncome}
        onClose={() => setShowAddIncome(false)}
        accounts={accounts}
        month={searchParams.get("month") || undefined}
        onSuccess={() => {
          setShowAddIncome(false);
          fetchData();
          notify("Income recorded!", "success");
        }}
      />

      {/* ── Quick Nickname Modal ── */}
      <Modal
        isOpen={!!editNicknameTarget}
        onClose={() => setEditNicknameTarget(null)}
        title={`Nickname · ${editNicknameTarget?.name || ""}`}
        size="sm"
      >
        <FormGroup>
          <Label>Nickname</Label>
          <ModalInput
            placeholder="e.g. Main, Joint"
            value={editNicknameValue}
            onChange={(e) => setEditNicknameValue(e.target.value)}
            maxLength={50}
          />
        </FormGroup>
        <ModalActions>
          <ModalButton onClick={() => setEditNicknameTarget(null)}>Cancel</ModalButton>
          <ModalButton $primary disabled={saving} onClick={handleQuickNickname}>
            {saving ? "Saving…" : "Save"}
          </ModalButton>
        </ModalActions>
      </Modal>

      {/* ── Quick Balance Update Modal ── */}
      <Modal
        isOpen={!!updateBalanceTarget}
        onClose={() => {
          setUpdateBalanceTarget(null);
          setUpdateBalanceValue("");
          setUpdateBalanceNote("");
        }}
        title={`Update Balance · ${updateBalanceTarget?.name || ""}`}
        size="sm"
      >
        <FormGroup>
          <Label>New Balance</Label>
          <ModalInput
            type="number"
            placeholder="Enter new balance"
            value={updateBalanceValue}
            onChange={(e) => setUpdateBalanceValue(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <Label>Note (optional)</Label>
          <ModalInput
            placeholder="e.g. Salary credited"
            value={updateBalanceNote}
            onChange={(e) => setUpdateBalanceNote(e.target.value)}
          />
        </FormGroup>
        <ModalActions>
          <ModalButton onClick={() => {
            setUpdateBalanceTarget(null);
            setUpdateBalanceValue("");
            setUpdateBalanceNote("");
          }}>Cancel</ModalButton>
          <ModalButton $primary disabled={saving || !updateBalanceValue} onClick={handleQuickBalance}>
            {saving ? "Saving…" : "Update"}
          </ModalButton>
        </ModalActions>
      </Modal>
    </PageWrapper>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div />}>
      <AccountsPageContent />
    </Suspense>
  );
}
