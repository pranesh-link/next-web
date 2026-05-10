"use client";

import Modal from "@/couple/_components/shared/Modal";
import LoanForm from "@/couple/_components/forms/LoanForm";
import type { Loan } from "../_utils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editTarget: Loan | null;
  scannedLoan: Partial<Loan> | null;
  submitting: boolean;
  onSubmit: (data: {
    name: string;
    loanProvider?: string;
    loanAccountNumber?: string;
    principalAmount: number;
    interestRate: number;
    tenureMonths: number;
    emiAmount: number;
    startDate: string;
    remainingBalance: number;
  }) => Promise<void>;
};

function toDateInput(d: string | Date): string {
  return typeof d === "string"
    ? d.split("T")[0]
    : new Date(d).toISOString().split("T")[0];
}

export default function LoanFormModal({
  isOpen,
  onClose,
  editTarget,
  scannedLoan,
  submitting,
  onSubmit,
}: Props) {
  const initialData = editTarget
    ? {
        name: editTarget.name,
        loanProvider: editTarget.loanProvider ?? undefined,
        loanAccountNumber: editTarget.loanAccountNumber ?? undefined,
        principalAmount: editTarget.principal,
        interestRate: editTarget.interestRate,
        tenureMonths: editTarget.tenureMonths,
        emiAmount: editTarget.emiAmount,
        startDate: toDateInput(editTarget.startDate),
        remainingBalance: editTarget.remainingBalance,
      }
    : scannedLoan
      ? {
          name: scannedLoan.name ?? "",
          loanProvider: scannedLoan.loanProvider ?? undefined,
          loanAccountNumber: scannedLoan.loanAccountNumber ?? undefined,
          principalAmount: scannedLoan.principal ?? 0,
          interestRate: scannedLoan.interestRate ?? 0,
          tenureMonths: scannedLoan.tenureMonths ?? 0,
          emiAmount: scannedLoan.emiAmount ?? 0,
          startDate: toDateInput(scannedLoan.startDate ?? new Date()),
          remainingBalance:
            scannedLoan.remainingBalance ?? scannedLoan.principal ?? 0,
        }
      : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editTarget ? "Edit Loan" : "Add Loan"}
      size="md"
    >
      <LoanForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onClose}
        isLoading={submitting}
      />
    </Modal>
  );
}
