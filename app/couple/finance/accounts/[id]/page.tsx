"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  PageWrapper,
  Content,
  NotificationBanner,
  BackLink,
  SmallButton,
  NotFoundWrapper,
  NotFoundIcon,
  NotFoundTitle,
  NotFoundSub,
} from "./_styled";
import { Account, ActivityItem, ActivityFilter } from "./_utils";
import { useNotification } from "./_components/useNotification";
import AccountHeaderCard from "./_components/AccountHeaderCard";
import ActivitySection from "./_components/ActivitySection";
import UpdateBalanceModal from "./_components/UpdateBalanceModal";
import EditAccountModal from "./_components/EditAccountModal";
import DeleteSection from "./_components/DeleteSection";

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [balanceNote, setBalanceNote] = useState("");
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [showUpdateBalance, setShowUpdateBalance] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editError, setEditError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { notification, notifLeaving, notify } = useNotification();

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

        <AccountHeaderCard
          account={account}
          onEdit={openEditModal}
          onUpdateBalance={() => setShowUpdateBalance(true)}
          onTogglePin={handleTogglePin}
          onToggleEmergency={handleToggleEmergency}
        />

        <ActivitySection
          filter={activityFilter}
          onFilterChange={setActivityFilter}
          loading={activityLoading}
          items={activityItems}
          nextCursor={nextCursor}
          loadingMore={loadingMore}
          onLoadMore={fetchActivity}
        />

        <DeleteSection
          confirmDelete={confirmDelete}
          saving={saving}
          onCancel={() => setConfirmDelete(false)}
          onAskConfirm={() => setConfirmDelete(true)}
          onDelete={handleDelete}
        />
      </Content>

      <UpdateBalanceModal
        isOpen={showUpdateBalance}
        onClose={() => {
          setShowUpdateBalance(false);
          setNewBalance("");
          setBalanceNote("");
        }}
        saving={saving}
        newBalance={newBalance}
        setNewBalance={setNewBalance}
        balanceNote={balanceNote}
        setBalanceNote={setBalanceNote}
        onSave={handleUpdateBalance}
      />

      <EditAccountModal
        isOpen={showEdit}
        onClose={() => {
          setShowEdit(false);
          setEditError("");
        }}
        saving={saving}
        editName={editName}
        setEditName={setEditName}
        editNickname={editNickname}
        setEditNickname={setEditNickname}
        editType={editType}
        setEditType={setEditType}
        editError={editError}
        onSave={handleEdit}
      />
    </PageWrapper>
  );
}
