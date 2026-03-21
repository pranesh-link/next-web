"use client";

import { createAccount, getAccounts } from "@/finance/_actions/accounts";
import {
    createTransaction,
    deleteTransaction,
    getTransactions,
    updateTransaction,
} from "@/finance/_actions/transactions";
import AccountForm from "@/finance/_components/forms/AccountForm";
import TransactionForm from "@/finance/_components/forms/TransactionForm";
import FinanceHeader from "@/finance/_components/layout/FinanceHeader";
import type { ScannedReceipt } from "@/finance/_components/receipt/ReceiptScanner";
import ReceiptScanner from "@/finance/_components/receipt/ReceiptScanner";
import EmptyState from "@/finance/_components/shared/EmptyState";
import LoadingSkeleton from "@/finance/_components/shared/LoadingSkeleton";
import Modal from "@/finance/_components/shared/Modal";
import TransactionTable from "@/finance/_components/tables/TransactionTable";
import { useCallback, useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";

/* ── Types ──────────────────────────────────────────── */

type Transaction = {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  date: string;
  accountId: string;
  accountName?: string;
  account?: { name: string };
};

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

type Notification = {
  message: string;
  type: "success" | "error";
};

type Filters = {
  month: string;
  category: string;
  accountId: string;
};

const CATEGORIES = [
  "Food",
  "Rent",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Salary",
  "Freelance",
  "Investment",
  "EMI",
  "Utilities",
  "Other",
];

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ── Keyframes ──────────────────────────────────────── */

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

/* ── Styled Components ──────────────────────────────── */

const PageWrapper = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

const FilterInput = styled.input`
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ${EASING};

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`;

const FilterSelect = styled.select`
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ${EASING};

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  option {
    background: var(--surface);
    color: var(--text);
  }
`;

const ClearButton = styled.button`
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    border-color: var(--border-strong);
    color: var(--text);
    background: var(--surface-hover);
  }
`;

const ConfirmBody = styled.div`
  text-align: center;
`;

const ConfirmText = styled.p`
  font-size: 14px;
  color: var(--text-dim);
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const ConfirmButton = styled.button<{ $variant: "danger" | "cancel" }>`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  background: ${(p) =>
    p.$variant === "danger" ? "var(--danger)" : "var(--surface)"};
  color: ${(p) => (p.$variant === "danger" ? "#fff" : "var(--text)")};
  border: 1px solid
    ${(p) => (p.$variant === "danger" ? "var(--danger)" : "var(--border)")};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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
        ? "rgba(34, 197, 94, 0.4)"
        : "rgba(239, 68, 68, 0.4)"};
  color: ${(p) =>
    p.$type === "success" ? "var(--success)" : "var(--danger)"};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
  pointer-events: none;
`;

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px 24px;
  color: var(--danger);
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
`;

const AddAccountLink = styled.button`
  background: none;
  border: none;
  color: var(--accent);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: opacity 0.2s ${EASING};

  &:hover {
    opacity: 0.8;
  }
`;

const NoAccountsBanner = styled.div`
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 12px;
  padding: 20px 24px;
  text-align: center;
  margin-bottom: 24px;
  color: #374151;
  font-size: 14px;
  line-height: 1.6;

  strong {
    display: block;
    margin-bottom: 8px;
    font-size: 15px;
    color: #111827;
  }
`;

const NoAccountsAction = styled.button`
  margin-top: 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;

const ScanReceiptBar = styled.div`
  margin-bottom: 16px;
`;

const ScanReceiptButton = styled.button`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: var(--accent-light);
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: var(--accent);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }
`;

/* ── Component ──────────────────────────────────────── */

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  const [scannedData, setScannedData] = useState<Partial<Transaction> | null>(null);

  const [filters, setFilters] = useState<Filters>({
    month: new Date().toISOString().slice(0, 7),
    category: "",
    accountId: "",
  });

  const [notification, setNotification] = useState<Notification | null>(null);
  const [notifLeaving, setNotifLeaving] = useState(false);
  const notifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* ── Notification helper ── */

  const notify = useCallback((message: string, type: "success" | "error") => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotifLeaving(false);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => {
      setNotifLeaving(true);
      setTimeout(() => setNotification(null), 300);
    }, 3000);
  }, []);

  /* ── Data fetching ── */

  const fetchTransactions = useCallback(async () => {
    const params: { month?: string; category?: string; accountId?: string } =
      {};
    if (filters.month) params.month = filters.month;
    if (filters.category) params.category = filters.category;
    if (filters.accountId) params.accountId = filters.accountId;

    const result = await getTransactions(params);
    if (result.success) {
      setTransactions(
        result.data.map((t: any) => ({
          ...t,
          type: t.type as "INCOME" | "EXPENSE",
          description: t.description ?? "",
          date:
            typeof t.date === "string"
              ? t.date
              : new Date(t.date).toISOString(),
          accountName: t.account?.name,
        })),
      );
      setError(null);
    } else {
      setError(result.error);
    }
  }, [filters]);

  const fetchAccounts = useCallback(async () => {
    const result = await getAccounts();
    if (result.success) {
      setAccounts(result.data);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await Promise.all([fetchTransactions(), fetchAccounts()]);
      setLoading(false);
    }
    load();
  }, [fetchTransactions, fetchAccounts]);

  /* ── Handlers ── */

  function handleOpenAdd() {
    setSelectedTransaction(null);
    setScannedData(null);
    setShowModal(true);
  }

  function handleScanComplete(data: ScannedReceipt) {
    setShowScanModal(false);
    setScannedData({
      amount: data.totalAmount ?? 0,
      type: "EXPENSE",
      category: data.category ?? "Other",
      description: data.description ?? data.storeName ?? "",
      date: data.date ?? new Date().toISOString().split("T")[0],
    } as Partial<Transaction>);
    setSelectedTransaction(null);
    setShowModal(true);
  }

  function handleEdit(id: string) {
    const txn = transactions.find((t) => t.id === id);
    if (txn) {
      setSelectedTransaction(txn);
      setShowModal(true);
    }
  }

  function handleDeletePrompt(id: string) {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setSubmitting(true);
    const result = await deleteTransaction(deleteTargetId);
    setSubmitting(false);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);

    if (result.success) {
      notify("Transaction deleted", "success");
      await fetchTransactions();
    } else {
      notify(result.error, "error");
    }
  }

  async function handleFormSubmit(data: {
    accountId: string;
    amount: number;
    type: string;
    category: string;
    description: string;
    date: string;
  }) {
    setSubmitting(true);

    const result = selectedTransaction
      ? await updateTransaction(selectedTransaction.id, data)
      : await createTransaction(data);

    setSubmitting(false);

    if (result.success) {
      notify(
        selectedTransaction ? "Transaction updated" : "Transaction added",
        "success",
      );
      setShowModal(false);
      setSelectedTransaction(null);
      await fetchTransactions();
    } else {
      notify(result.error, "error");
    }
  }

  function handleClearFilters() {
    setFilters({ month: new Date().toISOString().slice(0, 7), category: "", accountId: "" });
  }

  async function handleAccountSubmit(data: {
    name: string;
    type: string;
    balance: number;
  }) {
    setSubmitting(true);
    const result = await createAccount(data);
    setSubmitting(false);

    if (result.success) {
      notify("Account created", "success");
      setShowAccountModal(false);
      await fetchAccounts();
    } else {
      notify(result.error, "error");
    }
  }

  const hasActiveFilters =
    filters.month || filters.category || filters.accountId;

  /* ── Render ── */

  return (
    <>
      {notification && (
        <NotificationBanner $type={notification.type} $leaving={notifLeaving}>
          {notification.message}
        </NotificationBanner>
      )}

      <FinanceHeader
        title="Transactions"
        action={{ label: "Add Transaction", onClick: handleOpenAdd }}
        onRefresh={async () => {
          await Promise.all([fetchTransactions(), fetchAccounts()]);
        }}
      />

      <PageWrapper>
        {/* Scan Receipt Button */}
        <ScanReceiptBar>
          <ScanReceiptButton type="button" onClick={() => setShowScanModal(true)}>
            📸 Scan Receipt
          </ScanReceiptButton>
        </ScanReceiptBar>
        {/* No Accounts Banner */}
        {!loading && accounts.length === 0 && (
          <NoAccountsBanner>
            <strong>No accounts yet</strong>
            You need at least one account before adding transactions.
            <br />
            <NoAccountsAction
              type="button"
              onClick={() => setShowAccountModal(true)}
            >
              + Create Your First Account
            </NoAccountsAction>
          </NoAccountsBanner>
        )}

        {/* Filters */}
        <FilterBar>
          <FilterInput
            type="month"
            value={filters.month}
            onChange={(e) =>
              setFilters((f) => ({ ...f, month: e.target.value }))
            }
            aria-label="Filter by month"
          />
          <FilterSelect
            value={filters.category}
            onChange={(e) =>
              setFilters((f) => ({ ...f, category: e.target.value }))
            }
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={filters.accountId}
            onChange={(e) =>
              setFilters((f) => ({ ...f, accountId: e.target.value }))
            }
            aria-label="Filter by account"
          >
            <option value="">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </FilterSelect>
          <AddAccountLink
            type="button"
            onClick={() => setShowAccountModal(true)}
          >
            + New Account
          </AddAccountLink>
          {hasActiveFilters && (
            <ClearButton type="button" onClick={handleClearFilters}>
              Clear Filters
            </ClearButton>
          )}
        </FilterBar>

        {/* Error */}
        {error && <ErrorBanner>{error}</ErrorBanner>}

        {/* Content */}
        {loading ? (
          <LoadingSkeleton type="table" />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description={
              hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "Start by adding your first transaction."
            }
            action={
              hasActiveFilters
                ? { label: "Clear Filters", onClick: handleClearFilters }
                : { label: "Add Transaction", onClick: handleOpenAdd }
            }
          />
        ) : (
          <TransactionTable
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
          />
        )}
      </PageWrapper>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedTransaction(null);
        }}
        title={selectedTransaction ? "Edit Transaction" : "Add Transaction"}
      >
        <TransactionForm
          accounts={accounts}
          initialData={
            selectedTransaction
              ? {
                  accountId: selectedTransaction.accountId,
                  amount: selectedTransaction.amount,
                  type: selectedTransaction.type as "INCOME" | "EXPENSE",
                  category: selectedTransaction.category,
                  description: selectedTransaction.description,
                  date: selectedTransaction.date.split("T")[0],
                }
              : scannedData
                ? {
                    accountId: scannedData.accountId ?? "",
                    amount: scannedData.amount ?? 0,
                    type: (scannedData.type as "INCOME" | "EXPENSE") ?? "EXPENSE",
                    category: scannedData.category ?? "Other",
                    description: scannedData.description ?? "",
                    date: scannedData.date?.split("T")[0] ?? new Date().toISOString().split("T")[0],
                  }
                : undefined
          }
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowModal(false);
            setSelectedTransaction(null);
          }}
          isLoading={submitting}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        title="Delete Transaction"
        size="sm"
      >
        <ConfirmBody>
          <ConfirmText>
            Are you sure you want to delete this transaction? This action cannot
            be undone and the account balance will be adjusted accordingly.
          </ConfirmText>
          <ConfirmActions>
            <ConfirmButton
              $variant="cancel"
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTargetId(null);
              }}
              disabled={submitting}
            >
              Cancel
            </ConfirmButton>
            <ConfirmButton
              $variant="danger"
              type="button"
              onClick={handleDeleteConfirm}
              disabled={submitting}
            >
              {submitting ? "Deleting…" : "Delete"}
            </ConfirmButton>
          </ConfirmActions>
        </ConfirmBody>
      </Modal>

      {/* Add Account Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Create Account"
        size="sm"
      >
        <AccountForm
          onSubmit={handleAccountSubmit}
          onCancel={() => setShowAccountModal(false)}
          isLoading={submitting}
        />
      </Modal>

      {/* Scan Receipt Modal */}
      <Modal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        title="Scan Receipt"
        size="md"
        preventClose={isScanningReceipt}
      >
        <ReceiptScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanModal(false)}
          onScanningChange={setIsScanningReceipt}
        />
      </Modal>
    </>
  );
}
