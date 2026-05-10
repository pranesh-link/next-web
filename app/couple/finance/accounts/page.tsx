"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAccountsPageData } from "@/couple/finance/_actions/accounts";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";
import {
  AddButton,
  CardGrid,
  Content,
  NotificationBanner,
  PageWrapper,
  TotalAmount,
  TotalBar,
  TotalLabel,
} from "./_styled";
import { Account, CoupleUser, formatCurrency } from "./_utils";
import AccountListCard from "./_components/AccountListCard";
import AccountsModals from "./_components/AccountsModals";
import BalanceHistorySection from "./_components/BalanceHistorySection";
import { buildAccountsHandlers } from "./_components/accounts-handlers";
import { useBalanceHistory } from "./_components/useBalanceHistory";
import { useCreateAccountForm } from "./_components/useCreateAccountForm";
import { useNotification } from "./_components/useNotification";

/**
 * Inner accounts page (wrapped in `<Suspense>` for `useSearchParams`).
 *
 * Loads couple-wide accounts, total balance, and balance history; orchestrates
 * create / pin / quick-nickname / quick-balance / add-income modals.
 *
 * @returns The accounts page content element.
 */
function AccountsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [coupleUsers, setCoupleUsers] = useState<CoupleUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const [editNicknameTarget, setEditNicknameTarget] = useState<Account | null>(null);
  const [editNicknameValue, setEditNicknameValue] = useState("");
  const [updateBalanceTarget, setUpdateBalanceTarget] = useState<Account | null>(null);
  const [updateBalanceValue, setUpdateBalanceValue] = useState("");
  const [updateBalanceNote, setUpdateBalanceNote] = useState("");

  const form = useCreateAccountForm();
  const {
    items: historyItems,
    setItems: setHistoryItems,
    cursor: historyCursor,
    loading: historyLoading,
    fetchHistory,
  } = useBalanceHistory();
  const { notification, notifLeaving, notify } = useNotification();

  const fetchData = useCallback(async () => {
    const pageDataRes = await getAccountsPageData();
    if (pageDataRes.success) {
      setAccounts(pageDataRes.data.accounts as Account[]);
      setTotalBalance(pageDataRes.data.totalBalance);
      setCoupleUsers(pageDataRes.data.coupleUsers as CoupleUser[]);
      setCurrentUserId(pageDataRes.data.currentUserId || "");
      if (!form.newOwnerId && pageDataRes.data.currentUserId) {
        form.setNewOwnerId(pageDataRes.data.currentUserId);
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

  const prefetchAccountDetail = useCallback(
    (accountId: string) => {
      router.prefetch(`/couple/finance/accounts/${accountId}`);
    },
    [router],
  );

  useEffect(() => {
    if (accounts.length === 0) return;
    accounts.slice(0, 8).forEach((acc) => prefetchAccountDetail(acc.id));
  }, [accounts, prefetchAccountDetail]);

  useEffect(() => {
    if (showHistory && historyItems.length === 0) fetchHistory();
  }, [showHistory, historyItems.length, fetchHistory]);

  const existingSalaryAccount = accounts.find((a) => a.isSalaryAccount);
  const emergencyFundCount = accounts.filter((a) => a.isEmergencyFund).length;

  const { handlePin, handleCreate, handleQuickNickname, handleQuickBalance } =
    buildAccountsHandlers({
      form,
      currentUserId,
      notify,
      setSaving,
      setShowCreate,
      fetchData,
      editNicknameTarget,
      editNicknameValue,
      setEditNicknameTarget,
      updateBalanceTarget,
      updateBalanceValue,
      updateBalanceNote,
      setUpdateBalanceTarget,
      setUpdateBalanceValue,
      setUpdateBalanceNote,
      setHistoryItems,
    });

  return (
    <PageWrapper>
      <FinanceHeader title="Accounts" onRefresh={fetchData} />

      {notification && (
        <NotificationBanner $type={notification.type} $leaving={notifLeaving}>
          {notification.message}
        </NotificationBanner>
      )}

      <Content>
        <TotalBar>
          <div>
            <TotalLabel>Total Balance</TotalLabel>
            <TotalAmount>{formatCurrency(totalBalance)}</TotalAmount>
          </div>
          <AddButton
            onClick={() => {
              setShowCreate(true);
              form.setNewIsSalary(!existingSalaryAccount);
            }}
          >
            + Add Account
          </AddButton>
        </TotalBar>

        <BalanceHistorySection
          show={showHistory}
          onToggle={() => setShowHistory((v) => !v)}
          loading={historyLoading}
          items={historyItems}
          cursor={historyCursor}
          onLoadMore={(c) => fetchHistory(c)}
        />

        {loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : accounts.length === 0 ? (
          <EmptyState
            icon="🏦"
            title="No accounts yet"
            description="Add your first savings account to start tracking balances."
          />
        ) : (
          <CardGrid>
            {accounts.map((acc) => (
              <AccountListCard
                key={acc.id}
                account={acc}
                currentUserId={currentUserId}
                onCardClick={(id) => router.push(`/couple/finance/accounts/${id}`)}
                onPrefetch={prefetchAccountDetail}
                onPinClick={handlePin}
                onAddIncomeClick={() => setShowAddIncome(true)}
                onEditNicknameClick={(account) => {
                  setEditNicknameTarget(account);
                  setEditNicknameValue(account.nickname || "");
                }}
                onUpdateBalanceClick={(account) => {
                  setUpdateBalanceTarget(account);
                  setUpdateBalanceValue(String(account.balance));
                  setUpdateBalanceNote("");
                }}
              />
            ))}
          </CardGrid>
        )}
      </Content>

      <AccountsModals
        showCreate={showCreate}
        showAddIncome={showAddIncome}
        editNicknameTarget={editNicknameTarget}
        updateBalanceTarget={updateBalanceTarget}
        saving={saving}
        accounts={accounts}
        coupleUsers={coupleUsers}
        currentUserId={currentUserId}
        existingSalaryAccount={existingSalaryAccount}
        emergencyFundCount={emergencyFundCount}
        form={form}
        month={searchParams.get("month") || undefined}
        editNicknameValue={editNicknameValue}
        setEditNicknameValue={setEditNicknameValue}
        updateBalanceValue={updateBalanceValue}
        setUpdateBalanceValue={setUpdateBalanceValue}
        updateBalanceNote={updateBalanceNote}
        setUpdateBalanceNote={setUpdateBalanceNote}
        onCloseCreate={() => {
          setShowCreate(false);
          form.setCreateError("");
          form.setNewIsSalary(false);
        }}
        onCreate={handleCreate}
        onCloseAddIncome={() => setShowAddIncome(false)}
        onAddIncomeSuccess={() => {
          setShowAddIncome(false);
          fetchData();
          notify("Income recorded!", "success");
        }}
        onCloseEditNickname={() => setEditNicknameTarget(null)}
        onSaveNickname={handleQuickNickname}
        onCloseUpdateBalance={() => {
          setUpdateBalanceTarget(null);
          setUpdateBalanceValue("");
          setUpdateBalanceNote("");
        }}
        onSaveBalance={handleQuickBalance}
      />
    </PageWrapper>
  );
}

/**
 * Default export — wraps the accounts page in a `<Suspense>` boundary so
 * `useSearchParams` works at the App Router page level.
 *
 * @returns The accounts page tree.
 */
export default function AccountsPage() {
  return (
    <Suspense fallback={<div />}>
      <AccountsPageContent />
    </Suspense>
  );
}
