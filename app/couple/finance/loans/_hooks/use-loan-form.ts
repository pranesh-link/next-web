"use client";

import { useState } from "react";
import {
  createLoan,
  deleteLoan,
  updateLoan,
  updateScheduleAction,
} from "@/couple/finance/_actions/loans";
import type { ScannedLoanData } from "@/couple/_components/loan/LoanScheduleScanner";
import type { Loan, Prepayment } from "../_utils";

export type LoanFormData = {
  name: string;
  loanProvider?: string;
  loanAccountNumber?: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: string;
  remainingBalance: number;
};

type Args = {
  fetchLoans: () => Promise<void>;
  notify: (message: string, type: "success" | "error") => void;
};

export function useLoanForm({ fetchLoans, notify }: Args) {
  const [submitting, setSubmitting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Loan | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [showScanModal, setShowScanModal] = useState(false);
  const [isScanningSchedule, setIsScanningSchedule] = useState(false);
  const [scannedLoan, setScannedLoan] = useState<Partial<Loan> | null>(null);
  const [scannedLoanAccountNumber, setScannedLoanAccountNumber] = useState<string | null>(null);
  const [scannedLoanProvider, setScannedLoanProvider] = useState<string | null>(null);
  const [scannedScheduleGeneratedOn, setScannedScheduleGeneratedOn] = useState<string | null>(null);
  const [scannedPrepayments, setScannedPrepayments] = useState<Prepayment[] | null>(null);
  const [scannedSchedule, setScannedSchedule] = useState<
    { month: number; date: string; emi: number; principal: number; interest: number; balance: number }[] | null
  >(null);

  const [pendingScheduleParams, setPendingScheduleParams] = useState<{ rawScheduleText: string } | null>(null);
  const [pendingSchedule, setPendingSchedule] = useState<{ loanId: string; rawScheduleText: string } | null>(null);
  const [scheduleLoadingLoanId, setScheduleLoadingLoanId] = useState<string | null>(null);
  const [scheduleLoadErrors, setScheduleLoadErrors] = useState<Record<string, string>>({});

  function handleOpenAdd() {
    setEditTarget(null);
    setScannedLoan(null);
    setShowModal(true);
  }

  function handleScanComplete(data: ScannedLoanData) {
    setShowScanModal(false);
    setScannedPrepayments(
      data.prepayments && data.prepayments.length > 0
        ? data.prepayments.map((pp) => ({ ...pp, source: "scanned" as const }))
        : null,
    );
    setScannedSchedule(
      data.schedule && data.schedule.length > 0 ? data.schedule : null,
    );
    setScannedLoanAccountNumber(data.loanAccountNumber ?? null);
    setScannedLoanProvider(data.loanProvider ?? null);
    setScannedScheduleGeneratedOn(data.scheduleGeneratedOn ?? null);

    const rawText = data.rawScheduleText ?? "";
    setPendingScheduleParams(rawText ? { rawScheduleText: rawText } : null);

    setScannedLoan({
      name: data.loanName ?? "",
      loanProvider: data.loanProvider ?? null,
      loanAccountNumber: data.loanAccountNumber ?? null,
      scheduleGeneratedOn: data.scheduleGeneratedOn ?? null,
      principal: data.principal ?? 0,
      interestRate: data.interestRate ?? 0,
      tenureMonths: data.tenureMonths ?? 0,
      emiAmount: data.emiAmount ?? 0,
      startDate: data.startDate ?? new Date().toISOString().split("T")[0],
      remainingBalance: data.remainingBalance || data.principal || 0,
    });
    setEditTarget(null);
    setShowModal(true);
  }

  function handleEdit(loan: Loan) {
    setEditTarget(loan);
    setShowModal(true);
  }

  function handleDeletePrompt(id: string) {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setSubmitting(true);
    const result = await deleteLoan(deleteTargetId);
    setSubmitting(false);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);

    if (result.success) {
      notify("Loan deleted", "success");
      await fetchLoans();
    } else {
      notify(result.error, "error");
    }
  }

  async function loadFullSchedule(loanId: string, rawScheduleText: string) {
    setScheduleLoadingLoanId(loanId);
    setScheduleLoadErrors((prev) => { const n = { ...prev }; delete n[loanId]; return n; });

    try {
      const data = await updateScheduleAction(loanId, rawScheduleText);
      if (!data.success) {
        setScheduleLoadErrors((prev) => ({
          ...prev,
          [loanId]: data.error || "Schedule extraction failed",
        }));
      } else {
        setPendingSchedule(null);
        await fetchLoans();
      }
    } catch {
      setScheduleLoadErrors((prev) => ({
        ...prev,
        [loanId]: "Network error \u2014 tap Retry to try again",
      }));
    } finally {
      setScheduleLoadingLoanId(null);
    }
  }

  async function handleFormSubmit(data: LoanFormData) {
    setSubmitting(true);

    const payload = {
      name: data.name,
      ...(scannedLoanProvider
        ? { loanProvider: scannedLoanProvider }
        : data.loanProvider
          ? { loanProvider: data.loanProvider }
          : {}),
      ...(scannedLoanAccountNumber
        ? { loanAccountNumber: scannedLoanAccountNumber }
        : data.loanAccountNumber
          ? { loanAccountNumber: data.loanAccountNumber }
          : {}),
      principal: data.principalAmount,
      interestRate: data.interestRate,
      tenureMonths: data.tenureMonths,
      emiAmount: data.emiAmount,
      startDate: data.startDate,
      remainingBalance: data.remainingBalance,
      ...(scannedScheduleGeneratedOn ? { scheduleGeneratedOn: scannedScheduleGeneratedOn } : {}),
      ...(scannedPrepayments ? { prepayments: scannedPrepayments } : {}),
      ...(scannedSchedule ? { schedule: scannedSchedule } : {}),
    };

    const result = editTarget
      ? await updateLoan(editTarget.id, payload)
      : await createLoan(payload);

    setSubmitting(false);
    setScannedPrepayments(null);
    setScannedSchedule(null);
    setScannedLoanAccountNumber(null);
    setScannedLoanProvider(null);
    setScannedScheduleGeneratedOn(null);

    if (result.success) {
      notify(editTarget ? "Loan updated" : "Loan added", "success");
      const loanId = (editTarget?.id ?? result.data?.id) as string;
      setShowModal(false);
      setEditTarget(null);

      if (pendingScheduleParams?.rawScheduleText && loanId) {
        const { rawScheduleText } = pendingScheduleParams;
        setPendingScheduleParams(null);
        setPendingSchedule({ loanId, rawScheduleText });
        loadFullSchedule(loanId, rawScheduleText);
      } else {
        await fetchLoans();
      }
    } else {
      notify(result.error, "error");
    }
  }

  return {
    submitting,
    showModal, setShowModal, editTarget, setEditTarget,
    showDeleteConfirm, setShowDeleteConfirm, setDeleteTargetId,
    showScanModal, setShowScanModal, isScanningSchedule, setIsScanningSchedule,
    scannedLoan,
    pendingSchedule, scheduleLoadingLoanId, scheduleLoadErrors,
    handleOpenAdd, handleScanComplete, handleEdit, handleDeletePrompt,
    handleDeleteConfirm, handleFormSubmit, loadFullSchedule,
  };
}
