"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addPrepayment,
  getLoanInsightsAction,
  getLoans,
  getLoanSchedule,
  removePrepayment,
  simulateLoanPrepayment,
} from "@/couple/finance/_actions/loans";
import type {
  InsightResult,
  Loan,
  PrepaymentResult,
  ScheduleEntry,
} from "../_utils";
import { useNotification } from "./use-notification";
import { useLoanForm } from "./use-loan-form";

export function useLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scheduleCache, setScheduleCache] = useState<Record<string, ScheduleEntry[]>>({});

  const [simulatorLoanId, setSimulatorLoanId] = useState<string | null>(null);
  const [prepaymentAmount, setPrepaymentAmount] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<PrepaymentResult | null>(null);

  const [insightsLoanId, setInsightsLoanId] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState<InsightResult | null>(null);

  const [scheduleLoanId, setScheduleLoanId] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[] | null>(null);

  const [prepaymentModalLoanId, setPrepaymentModalLoanId] = useState<string | null>(null);
  const [ppDate, setPpDate] = useState("");
  const [ppAmount, setPpAmount] = useState("");
  const [ppSubmitting, setPpSubmitting] = useState(false);

  const { notification, notifLeaving, notify } = useNotification();

  const fetchLoans = useCallback(async () => {
    const result = await getLoans();
    if (result.success) {
      const loansData = result.data as unknown as Loan[];
      setLoans(loansData);
      setError(null);
      setScheduleCache((prev) => {
        const updated = { ...prev };
        for (const loan of loansData) {
          if (Array.isArray(loan.schedule) && loan.schedule.length > 0) {
            updated[loan.id] = loan.schedule;
          }
        }
        return updated;
      });
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        await fetchLoans();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load loans");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [fetchLoans]);

  const form = useLoanForm({ fetchLoans, notify });

  /* ── Summary ── */
  const totalLoans = loans.length;
  const totalOutstanding = loans.reduce((s, l) => s + l.remainingBalance, 0);
  const monthlyEmiLoad = loans.reduce((s, l) => {
    const schedule = scheduleCache[l.id] ?? (Array.isArray(l.schedule) ? l.schedule : null);
    if (schedule && schedule.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const nextEntry = schedule.find((e) => {
        const d = new Date(e.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() >= today.getTime();
      });
      return s + (nextEntry ? nextEntry.emi : l.emiAmount);
    }
    return s + l.emiAmount;
  }, 0);

  /* ── Panel toggles ── */

  function toggleSimulator(loanId: string) {
    if (simulatorLoanId === loanId) {
      setSimulatorLoanId(null);
      setSimResult(null);
      setPrepaymentAmount("");
    } else {
      setSimulatorLoanId(loanId);
      setSimResult(null);
      setPrepaymentAmount("");
      if (insightsLoanId === loanId) { setInsightsLoanId(null); setInsightsData(null); }
    }
  }

  async function handleSimulate() {
    if (!simulatorLoanId || !prepaymentAmount) return;
    const amount = parseFloat(prepaymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSimulating(true);
    const result = await simulateLoanPrepayment(simulatorLoanId, amount);
    setSimulating(false);

    if (result.success) {
      setSimResult(result.data);
    } else {
      notify(result.error, "error");
    }
  }

  async function toggleInsights(loanId: string) {
    if (insightsLoanId === loanId) {
      setInsightsLoanId(null);
      setInsightsData(null);
      return;
    }
    if (simulatorLoanId === loanId) { setSimulatorLoanId(null); setSimResult(null); setPrepaymentAmount(""); }
    setInsightsLoanId(loanId);
    setInsightsLoading(true);
    const result = await getLoanInsightsAction(loanId);
    setInsightsLoading(false);

    if (result.success) {
      setInsightsData(result.data);
    } else {
      notify(result.error, "error");
      setInsightsLoanId(null);
    }
  }

  async function toggleSchedule(loanId: string) {
    if (simulatorLoanId === loanId) { setSimulatorLoanId(null); setSimResult(null); setPrepaymentAmount(""); }
    if (insightsLoanId === loanId) { setInsightsLoanId(null); setInsightsData(null); }
    setScheduleLoanId(loanId);

    if (scheduleCache[loanId]) {
      setScheduleData(scheduleCache[loanId]);
      return;
    }

    setScheduleData(null);
    setScheduleLoading(true);
    const result = await getLoanSchedule(loanId);
    setScheduleLoading(false);

    if (result.success) {
      const rows = result.data as ScheduleEntry[];
      setScheduleData(rows);
      setScheduleCache((prev) => ({ ...prev, [loanId]: rows }));
    } else {
      notify(result.error, "error");
      setScheduleLoanId(null);
    }
  }

  async function handleAddPrepayment() {
    if (!prepaymentModalLoanId || !ppDate || !ppAmount) return;
    const amount = parseFloat(ppAmount);
    if (isNaN(amount) || amount <= 0) return;

    setPpSubmitting(true);
    const result = await addPrepayment(prepaymentModalLoanId, { date: ppDate, amount });
    setPpSubmitting(false);

    if (result.success) {
      notify("Prepayment added — remaining balance updated", "success");
      setPpDate("");
      setPpAmount("");
      await fetchLoans();
    } else {
      notify(result.error, "error");
    }
  }

  async function handleRemovePrepayment(index: number) {
    if (!prepaymentModalLoanId) return;
    const result = await removePrepayment(prepaymentModalLoanId, index);

    if (result.success) {
      notify("Prepayment removed — remaining balance restored", "success");
      await fetchLoans();
    } else {
      notify(result.error, "error");
    }
  }

  return {
    /* data */
    loans, loading, error, fetchLoans,
    /* form/scan/delete (forwarded) */
    ...form,
    /* panels */
    simulatorLoanId, prepaymentAmount, setPrepaymentAmount, simulating, simResult,
    insightsLoanId, insightsLoading, insightsData,
    scheduleLoanId, setScheduleLoanId, scheduleLoading, scheduleData, setScheduleData,
    prepaymentModalLoanId, setPrepaymentModalLoanId,
    ppDate, setPpDate, ppAmount, setPpAmount, ppSubmitting,
    /* notification */
    notification, notifLeaving,
    /* derived */
    totalLoans, totalOutstanding, monthlyEmiLoad,
    /* handlers */
    toggleSimulator, handleSimulate, toggleInsights, toggleSchedule,
    handleAddPrepayment, handleRemovePrepayment,
  };
}
