"use client";

import {
  createAccount,
  togglePinAccount,
  updateAccount,
  updateAccountBalance,
} from "@/couple/finance/_actions/accounts";
import type { Account } from "../_utils";
import type { useCreateAccountForm } from "./useCreateAccountForm";

type Notify = (message: string, type: "success" | "error") => void;
type CreateForm = ReturnType<typeof useCreateAccountForm>;

/**
 * Build the four CRUD handlers for the accounts page.
 *
 * Returns ready-to-use async functions for pinning, creating, quick-nickname,
 * and quick-balance updates so the page component avoids inline definitions.
 *
 * @param deps - Dependencies bag carrying the form, setters, notifier, and
 *   refresh callback used by every handler.
 * @returns An object with `handlePin`, `handleCreate`, `handleQuickNickname`,
 *   and `handleQuickBalance`.
 */
export function buildAccountsHandlers(deps: {
  form: CreateForm;
  currentUserId: string;
  notify: Notify;
  setSaving: (v: boolean) => void;
  setShowCreate: (v: boolean) => void;
  fetchData: () => Promise<void>;
  editNicknameTarget: Account | null;
  editNicknameValue: string;
  setEditNicknameTarget: (v: Account | null) => void;
  updateBalanceTarget: Account | null;
  updateBalanceValue: string;
  updateBalanceNote: string;
  setUpdateBalanceTarget: (v: Account | null) => void;
  setUpdateBalanceValue: (v: string) => void;
  setUpdateBalanceNote: (v: string) => void;
  setHistoryItems: (v: never[]) => void;
}) {
  const {
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
  } = deps;

  async function handlePin(e: React.MouseEvent, accountId: string) {
    e.stopPropagation();
    const res = await togglePinAccount(accountId);
    if (res.success) await fetchData();
    else notify(res.error, "error");
  }

  async function handleCreate() {
    setSaving(true);
    form.setCreateError("");
    const res = await createAccount({
      name: form.newName.trim(),
      nickname: form.newNickname.trim() || undefined,
      type: form.newType,
      balance: parseFloat(form.newBalance) || 0,
      isSalaryAccount: form.newIsSalary,
      isEmergencyFund: form.newIsEmergency,
      ownerId: form.newOwnerId || currentUserId,
    });
    if (res.success) {
      notify("Account created!", "success");
      setShowCreate(false);
      form.reset(currentUserId);
      await fetchData();
    } else {
      form.setCreateError(res.error);
    }
    setSaving(false);
  }

  async function handleQuickNickname() {
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
  }

  async function handleQuickBalance() {
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
  }

  return { handlePin, handleCreate, handleQuickNickname, handleQuickBalance };
}
