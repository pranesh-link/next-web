"use client";

import TransactionForm from "@/couple/_components/forms/TransactionForm";
import Modal from "@/couple/_components/shared/Modal";
import type { Account, Transaction } from "../_utils";

type FormData = {
  accountId: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
};

type Props = {
  isOpen: boolean;
  accounts: Account[];
  selectedTransaction: Transaction | null;
  scannedData: Partial<Transaction> | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
};

export default function TransactionFormModal({
  isOpen,
  accounts,
  selectedTransaction,
  scannedData,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={submitting}
      />
    </Modal>
  );
}
