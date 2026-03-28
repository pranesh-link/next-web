"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled, { keyframes } from "styled-components";
import ReactSelect, { StylesConfig } from "react-select";
import {
  getAccounts,
  createAccount,
  getTotalBalance,
} from "@/couple/finance/_actions/accounts";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import Modal from "@/couple/_components/shared/Modal";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import AddIncomeModal from "@/couple/_components/shared/AddIncomeModal";

/* ── Types ──────────────────────────────────────────── */

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  isSalaryAccount: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type Notification = { message: string; type: "success" | "error" };

/* ── Helpers ────────────────────────────────────────── */

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

function formatCurrency(v: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
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
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  animation: ${fadeIn} 0.3s ${EASING};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const AccountCard = styled.div`
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
  align-items: center;
  gap: 14px;
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
`;

const CardName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CardType = styled.div`
  font-size: 12px;
  color: var(--text-muted);
`;

const CardBalance = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  text-align: right;
  flex-shrink: 0;
`;

const CardUpdated = styled.div`
  font-size: 11px;
  color: var(--text-muted);
  text-align: right;
  margin-top: 2px;
`;

const CardChevron = styled.div`
  color: var(--text-muted);
  font-size: 16px;
  flex-shrink: 0;
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
  font-size: 10px;
  font-weight: 600;
  color: #b45309;
  background: rgba(251, 191, 36, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 6px;
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

  // Create form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("SAVINGS_ACCOUNT");
  const [newBalance, setNewBalance] = useState("");
  const [newIsSalary, setNewIsSalary] = useState(false);
  const [createError, setCreateError] = useState("");

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
    const [accRes, balRes] = await Promise.all([
      getAccounts(),
      getTotalBalance(),
    ]);
    if (accRes.success) setAccounts(accRes.data as Account[]);
    if (balRes.success) setTotalBalance(balRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (searchParams.get("addIncome") === "true" && !loading && accounts.length > 0) {
      setShowAddIncome(true);
    }
  }, [searchParams, loading, accounts.length]);

  const existingSalaryAccount = accounts.find((a) => a.isSalaryAccount);

  const handleCreate = async () => {
    setSaving(true);
    setCreateError("");
    const res = await createAccount({
      name: newName.trim(),
      type: newType,
      balance: parseFloat(newBalance) || 0,
      isSalaryAccount: newIsSalary,
    });
    if (res.success) {
      notify("Account created!", "success");
      setShowCreate(false);
      setNewName("");
      setNewType("SAVINGS_ACCOUNT");
      setNewBalance("");
      setNewIsSalary(false);
      await fetchData();
    } else {
      setCreateError(res.error);
    }
    setSaving(false);
  };

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

        {/* ── Account Cards ── */}
        {accounts.length === 0 ? (
          <EmptyState
            icon="🏦"
            title="No accounts yet"
            description="Add your first savings account to start tracking balances."
          />
        ) : (
          <CardGrid>
            {accounts.map((acc) => (
              <AccountCard
                key={acc.id}
                onClick={() => router.push(`/finance/accounts/${acc.id}`)}
              >
                <CardHeader>
                  <CardIcon>{typeIcon(acc.type)}</CardIcon>
                  <CardInfo>
                    <CardName>{acc.name}{acc.isSalaryAccount && <SalaryBadge>Salary</SalaryBadge>}</CardName>
                    <CardType>{typeLabel(acc.type)}</CardType>
                  </CardInfo>
                  <div>
                    <CardBalance>{formatCurrency(acc.balance)}</CardBalance>
                    <CardUpdated>on {formatDate(acc.updatedAt)}</CardUpdated>
                  </div>
                  <CardChevron>›</CardChevron>
                </CardHeader>
              </AccountCard>
            ))}
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
            disabled={saving || !newName.trim()}
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
