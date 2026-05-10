"use client";

import AddIncomeModal from "@/couple/_components/shared/AddIncomeModal";
import CreateAccountModal from "./CreateAccountModal";
import QuickNicknameModal from "./QuickNicknameModal";
import QuickBalanceModal from "./QuickBalanceModal";
import type { Account, CoupleUser } from "../_utils";
import type { useCreateAccountForm } from "./useCreateAccountForm";

type CreateForm = ReturnType<typeof useCreateAccountForm>;

type Props = {
  /** Whether the create-account modal is open. */
  showCreate: boolean;
  /** Whether the add-income modal is open. */
  showAddIncome: boolean;
  /** Account selected for nickname editing (or null). */
  editNicknameTarget: Account | null;
  /** Account selected for quick balance update (or null). */
  updateBalanceTarget: Account | null;
  /** True while a save is in flight. */
  saving: boolean;
  /** All accounts (passed through to the add-income modal). */
  accounts: Account[];
  /** Couple members for the owner selector. */
  coupleUsers: CoupleUser[];
  /** Current viewer's user id. */
  currentUserId: string;
  /** Existing salary account, if any. */
  existingSalaryAccount: Account | undefined;
  /** Number of accounts already flagged as emergency funds. */
  emergencyFundCount: number;
  /** Bag returned by {@link useCreateAccountForm}. */
  form: CreateForm;
  /** Optional `?month=` query string passed to the add-income modal. */
  month: string | undefined;
  /** Quick-nickname controlled input value. */
  editNicknameValue: string;
  /** Setter for the quick-nickname value. */
  setEditNicknameValue: (v: string) => void;
  /** Quick-balance controlled input value. */
  updateBalanceValue: string;
  /** Setter for the quick-balance value. */
  setUpdateBalanceValue: (v: string) => void;
  /** Note attached to a quick-balance update. */
  updateBalanceNote: string;
  /** Setter for the quick-balance note. */
  setUpdateBalanceNote: (v: string) => void;
  /** Close the create-account modal. */
  onCloseCreate: () => void;
  /** Submit handler for the create-account modal. */
  onCreate: () => void;
  /** Close the add-income modal. */
  onCloseAddIncome: () => void;
  /** Add-income success callback. */
  onAddIncomeSuccess: () => void;
  /** Close the quick-nickname modal. */
  onCloseEditNickname: () => void;
  /** Save handler for the quick-nickname modal. */
  onSaveNickname: () => void;
  /** Close the quick-balance modal. */
  onCloseUpdateBalance: () => void;
  /** Save handler for the quick-balance modal. */
  onSaveBalance: () => void;
};

/**
 * Render all modal dialogs for the accounts page.
 *
 * Wires the form state from {@link useCreateAccountForm} into the
 * create-account modal and forwards quick-edit handlers for nickname and
 * balance, plus the add-income modal.
 *
 * @param props - {@link Props} bag with open state, data, and callbacks.
 * @returns The combined modal fragment.
 */
export default function AccountsModals({
  showCreate,
  showAddIncome,
  editNicknameTarget,
  updateBalanceTarget,
  saving,
  accounts,
  coupleUsers,
  currentUserId,
  existingSalaryAccount,
  emergencyFundCount,
  form,
  month,
  editNicknameValue,
  setEditNicknameValue,
  updateBalanceValue,
  setUpdateBalanceValue,
  updateBalanceNote,
  setUpdateBalanceNote,
  onCloseCreate,
  onCreate,
  onCloseAddIncome,
  onAddIncomeSuccess,
  onCloseEditNickname,
  onSaveNickname,
  onCloseUpdateBalance,
  onSaveBalance,
}: Props) {
  return (
    <>
      <CreateAccountModal
        isOpen={showCreate}
        onClose={onCloseCreate}
        saving={saving}
        coupleUsers={coupleUsers}
        currentUserId={currentUserId}
        existingSalaryAccount={existingSalaryAccount}
        emergencyFundCount={emergencyFundCount}
        newName={form.newName}
        setNewName={form.setNewName}
        newNickname={form.newNickname}
        setNewNickname={form.setNewNickname}
        newType={form.newType}
        setNewType={form.setNewType}
        newBalance={form.newBalance}
        setNewBalance={form.setNewBalance}
        newIsSalary={form.newIsSalary}
        setNewIsSalary={form.setNewIsSalary}
        newIsEmergency={form.newIsEmergency}
        setNewIsEmergency={form.setNewIsEmergency}
        newOwnerId={form.newOwnerId}
        setNewOwnerId={form.setNewOwnerId}
        createError={form.createError}
        onCreate={onCreate}
      />

      <AddIncomeModal
        isOpen={showAddIncome}
        onClose={onCloseAddIncome}
        accounts={accounts}
        month={month}
        onSuccess={onAddIncomeSuccess}
      />

      <QuickNicknameModal
        isOpen={!!editNicknameTarget}
        onClose={onCloseEditNickname}
        targetName={editNicknameTarget?.name}
        saving={saving}
        value={editNicknameValue}
        setValue={setEditNicknameValue}
        onSave={onSaveNickname}
      />

      <QuickBalanceModal
        isOpen={!!updateBalanceTarget}
        onClose={onCloseUpdateBalance}
        targetName={updateBalanceTarget?.name}
        saving={saving}
        value={updateBalanceValue}
        setValue={setUpdateBalanceValue}
        note={updateBalanceNote}
        setNote={setUpdateBalanceNote}
        onSave={onSaveBalance}
      />
    </>
  );
}
