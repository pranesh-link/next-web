"use client";

import React, { useState, useEffect } from "react";
import ReactSelect from "react-select";
import Modal from "@/couple/_components/shared/Modal";
import { createTransaction } from "@/couple/finance/_actions/transactions";
import { setSalaryAccount } from "@/couple/finance/_actions/accounts";
import {
  type SelectOption,
  getDefaultDescription,
  getTodayString,
  selectStyles,
} from "./_AddIncomeModal/utils";
import {
  Checkbox,
  CheckboxLabel,
  CheckboxRow,
  EmptyMessage,
  ErrorText,
  FormGroup,
  Label,
  ModalActions,
  ModalButton,
  ModalInput,
  WarningAlert,
} from "./_AddIncomeModal/styled";

/** Account row passed to {@link AddIncomeModal}. */
interface AccountOption {
  /** Account id. */
  id: string;
  /** Display name. */
  name: string;
  /** Account type (e.g. `SAVINGS`). */
  type: string;
  /** Current balance. */
  balance: number;
  /** Whether this account is currently flagged as the salary account. */
  isSalaryAccount: boolean;
}

/** Props for {@link AddIncomeModal}. */
interface AddIncomeModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Called when the user dismisses the modal. */
  onClose: () => void;
  /** Accounts available for crediting income to. */
  accounts: AccountOption[];
  /** Optional month label used to seed the default description. */
  month?: string;
  /** Called after a successful income transaction is created. */
  onSuccess: () => void;
}

/**
 * Modal form for recording an income (salary) transaction against an account.
 *
 * @param props - See {@link AddIncomeModalProps}.
 * @remarks Calls `createTransaction` and optionally `setSalaryAccount` server actions.
 */
export default function AddIncomeModal({
  isOpen,
  onClose,
  accounts,
  month,
  onSuccess,
}: AddIncomeModalProps) {
  const salaryAccount = accounts.find((a) => a.isSalaryAccount);
  const defaultAccountId = salaryAccount?.id ?? accounts[0]?.id ?? "";

  const [accountId, setAccountId] = useState(defaultAccountId);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [description, setDescription] = useState(getDefaultDescription(month));
  const [setAsSalary, setSetAsSalary] = useState(!salaryAccount);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens or accounts/month change
  useEffect(() => {
    if (isOpen) {
      const sal = accounts.find((a) => a.isSalaryAccount);
      setAccountId(sal?.id ?? accounts[0]?.id ?? "");
      setAmount("");
      setDate(getTodayString());
      setDescription(getDefaultDescription(month));
      setSetAsSalary(!sal);
      setError("");
    }
  }, [isOpen, accounts, month]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isSelectedSalaryAccount = selectedAccount?.isSalaryAccount ?? false;
  const showCheckbox = !isSelectedSalaryAccount;
  const existingSalaryAccount =
    salaryAccount && salaryAccount.id !== accountId ? salaryAccount : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !amount) return;

    setSubmitting(true);
    setError("");

    try {
      if (setAsSalary && showCheckbox) {
        await setSalaryAccount(accountId);
      }

      await createTransaction({
        accountId,
        amount: parseFloat(amount),
        type: "INCOME",
        category: "Salary",
        description,
        date: new Date(date),
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record income");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Income" size="sm">
      {accounts.length === 0 ? (
        <EmptyMessage>Create an account first to record income.</EmptyMessage>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="income-account">Account</Label>
            <ReactSelect<SelectOption>
              options={accounts.map((acct) => ({
                value: acct.id,
                label:
                  acct.name + (acct.isSalaryAccount ? " (Salary Account)" : ""),
              }))}
              value={
                accountId
                  ? {
                      value: accountId,
                      label:
                        (accounts.find((a) => a.id === accountId)?.name ?? "") +
                        (accounts.find((a) => a.id === accountId)
                          ?.isSalaryAccount
                          ? " (Salary Account)"
                          : ""),
                    }
                  : null
              }
              onChange={(opt) => {
                const newId = opt?.value ?? "";
                setAccountId(newId);
                const acct = accounts.find((a) => a.id === newId);
                if (acct?.isSalaryAccount) {
                  setSetAsSalary(false);
                } else if (!salaryAccount) {
                  setSetAsSalary(true);
                } else {
                  setSetAsSalary(false);
                }
              }}
              styles={selectStyles}
              isSearchable={false}
              placeholder="Select account..."
              menuPortalTarget={
                typeof document !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="income-amount">Amount</Label>
            <ModalInput
              id="income-amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="income-date">Date of Credit</Label>
            <ModalInput
              id="income-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="income-description">Description</Label>
            <ModalInput
              id="income-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormGroup>

          {showCheckbox && (
            <FormGroup>
              <CheckboxRow>
                <Checkbox
                  id="income-salary-checkbox"
                  type="checkbox"
                  checked={setAsSalary}
                  onChange={(e) => setSetAsSalary(e.target.checked)}
                />
                <CheckboxLabel htmlFor="income-salary-checkbox">
                  Set as salary account?
                </CheckboxLabel>
              </CheckboxRow>
              {setAsSalary && existingSalaryAccount && (
                <WarningAlert>
                  ⚠️ &ldquo;{existingSalaryAccount.name}&rdquo; is currently
                  your salary account. Setting this as salary account will
                  replace it.
                </WarningAlert>
              )}
            </FormGroup>
          )}

          {error && <ErrorText>{error}</ErrorText>}

          <ModalActions>
            <ModalButton type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </ModalButton>
            <ModalButton
              type="submit"
              $primary
              disabled={submitting || !accountId || !amount}
            >
              {submitting ? "Saving..." : "Add Income"}
            </ModalButton>
          </ModalActions>
        </form>
      )}
    </Modal>
  );
}
