"use client";

import { createAccount } from "@/couple/finance/_actions/accounts";
import {
  createTransaction,
  deleteTransaction,
  getTransactionsPageData,
  updateTransaction,
} from "@/couple/finance/_actions/transactions";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import type { ScannedReceipt } from "@/couple/_components/receipt/ReceiptScanner";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import TransactionTable from "@/couple/_components/tables/TransactionTable";
import { useCallback, useEffect, useState } from "react";
import NoAccountsBanner from "./_components/NoAccountsBanner";
import NotificationToast from "./_components/NotificationToast";
import TransactionFilters from "./_components/TransactionFilters";
import TransactionsModals from "./_components/TransactionsModals";
import { useNotification } from "./_components/useNotification";
import {
  ErrorBanner,
  PageWrapper,
  ScanReceiptBar,
  ScanReceiptButton,
} from "./_styled";
import type {
  Account,
  Filters,
  Transaction,
} from "./_utils";

/**
 * Render the transactions page: filters, list, and the suite of CRUD modals.
 *
 * Handles loading transactions/accounts, applying filters, and orchestrating
 * the add/edit/delete flow plus receipt scanning and account creation.
 *
 * @returns The transactions page element.
 */
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

  const { notification, notifLeaving, notify } = useNotification();

  const fetchTransactions = useCallback(async () => {
    const params: { month?: string; category?: string; accountId?: string } =
      {};
    if (filters.month) params.month = filters.month;
    if (filters.category) params.category = filters.category;
    if (filters.accountId) params.accountId = filters.accountId;

    const result = await getTransactionsPageData(params);
    if (result.success) {
      setTransactions(
        result.data.transactions.map((t) => ({
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
      setAccounts(result.data.accounts);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [filters]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        await fetchTransactions();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchTransactions]);

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
      await fetchTransactions();
    } else {
      notify(result.error, "error");
    }
  }

  const hasActiveFilters = Boolean(
    filters.month || filters.category || filters.accountId,
  );

  return (
    <>
      <NotificationToast notification={notification} leaving={notifLeaving} />

      <FinanceHeader
        title="Transactions"
        action={{ label: "Add Transaction", onClick: handleOpenAdd }}
        onRefresh={async () => {
          await fetchTransactions();
        }}
      />

      <PageWrapper>
        <ScanReceiptBar>
          <ScanReceiptButton type="button" onClick={() => setShowScanModal(true)}>
            📸 Scan Receipt
          </ScanReceiptButton>
        </ScanReceiptBar>
        {!loading && accounts.length === 0 && (
          <NoAccountsBanner onCreate={() => setShowAccountModal(true)} />
        )}

        <TransactionFilters
          filters={filters}
          accounts={accounts}
          hasActiveFilters={hasActiveFilters}
          onChange={setFilters}
          onClear={handleClearFilters}
          onAddAccount={() => setShowAccountModal(true)}
        />

        {error && <ErrorBanner>{error}</ErrorBanner>}

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

      <TransactionsModals
        showModal={showModal}
        showDeleteConfirm={showDeleteConfirm}
        showAccountModal={showAccountModal}
        showScanModal={showScanModal}
        isScanningReceipt={isScanningReceipt}
        submitting={submitting}
        accounts={accounts}
        selectedTransaction={selectedTransaction}
        scannedData={scannedData}
        onCloseTransactionModal={() => {
          setShowModal(false);
          setSelectedTransaction(null);
        }}
        onSubmitTransaction={handleFormSubmit}
        onCloseDeleteModal={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirmDelete={handleDeleteConfirm}
        onCloseAccountModal={() => setShowAccountModal(false)}
        onSubmitAccount={handleAccountSubmit}
        onCloseScanModal={() => setShowScanModal(false)}
        onScanComplete={handleScanComplete}
        onScanningChange={setIsScanningReceipt}
      />
    </>
  );
}
