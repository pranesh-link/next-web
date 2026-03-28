"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import ReactSelect, { StylesConfig } from "react-select";
import Modal from "@/couple/_components/shared/Modal";
import { createTransaction } from "@/couple/finance/_actions/transactions";
import { setSalaryAccount } from "@/couple/finance/_actions/accounts";

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    isSalaryAccount: boolean;
  }>;
  month?: string;
  onSuccess: () => void;
}

function getDefaultDescription(month?: string): string {
  let targetDate: Date;
  if (month) {
    targetDate = new Date(Date.parse(month + " 1"));
  } else {
    const now = new Date();
    targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  const short = targetDate.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
  return `Salary for month ${short}`;
}

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

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

const ModalButton = styled.button<{ $primary?: boolean }>`
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
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

const ErrorText = styled.p`
  color: #ef4444;
  font-size: 13px;
  margin: 8px 0 0;
`;

const CheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 13px;
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
  margin-top: 8px;
`;

const EmptyMessage = styled.p`
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
`;

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
  const [description, setDescription] = useState(
    getDefaultDescription(month)
  );
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
      setError(
        err instanceof Error ? err.message : "Failed to record income"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Income" size="sm">
      {accounts.length === 0 ? (
        <EmptyMessage>
          Create an account first to record income.
        </EmptyMessage>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="income-account">Account</Label>
            <ReactSelect<SelectOption>
              options={accounts.map((acct) => ({
                value: acct.id,
                label: acct.name + (acct.isSalaryAccount ? " (Salary Account)" : ""),
              }))}
              value={
                accountId
                  ? {
                      value: accountId,
                      label:
                        (accounts.find((a) => a.id === accountId)?.name ?? "") +
                        (accounts.find((a) => a.id === accountId)?.isSalaryAccount
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
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
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
