"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getIncome,
  getBudgetPlan,
} from "@/couple/finance/_actions/budget-plans";
import {
  buildSuggestions,
  formatCurrency,
  formatMonthLabel,
  getCurrentMonth,
  getCurrentYear,
  newLineItem,
  shiftMonth,
  shiftYear,
  withIds,
  type LineItem,
  type SavedPlan,
} from "../_utils";
import { useNotification } from "./useNotification";
import { useImportPrev } from "./useImportPrev";
import {
  handleDeletePlan,
  handleSavePlan,
  importEMIs as runImportEMIs,
} from "./budget-planner-handlers";

/** Period mode for the planner — either calendar `monthly` or `yearly`. */
export type Mode = "monthly" | "yearly";

/**
 * Compose all state and behavior for the budget planner page.
 *
 * Wraps data loading, line-item editing, derived totals, EMI import, save,
 * delete, and prev-period import. Returns a flat object the page consumes
 * directly (state, computed values, setters, and async handlers).
 *
 * @returns Hook bag with planner state, derived values, setters, and
 *   handlers; also includes import-prev modal helpers.
 */
export function useBudgetPlanner() {
  const [monthAndYear, setMonthAndYear] = useState(getCurrentMonth);
  const [mode, setMode] = useState<Mode>("monthly");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [income, setIncome] = useState(0);
  const [incomeHint, setIncomeHint] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([newLineItem()]);

  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [prevPlan, setPrevPlan] = useState<SavedPlan | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

  const { notification, notifLeaving, notify } = useNotification();

  const importPrev = useImportPrev({
    mode,
    prevPlan,
    lineItems,
    setLineItems,
    notify,
  });

  const fetchData = useCallback(
    async (month: string, currentMode: Mode) => {
      setLoading(true);
      try {
        const prevPeriod =
          currentMode === "monthly" ? shiftMonth(month, -1) : shiftYear(month, -1);
        const [planResult, prevPlanResult, incomeResult] = await Promise.all([
          getBudgetPlan(month, currentMode),
          getBudgetPlan(prevPeriod, currentMode),
          getIncome(prevPeriod, currentMode),
        ]);

        // Stale-bundle guard: if a deploy invalidated server-action IDs the
        // result will be undefined — surface a reload hint instead of crashing.
        if (!planResult || !prevPlanResult || !incomeResult) {
          notify("App was updated. Please reload the page.", "error");
          return;
        }

        if (prevPlanResult.success && prevPlanResult.data) {
          setPrevPlan(prevPlanResult.data);
        } else {
          setPrevPlan(null);
        }

        if (planResult.success && planResult.data) {
          const plan = planResult.data;
          setSavedPlan(plan);
          setIncome(plan.income);
          setLineItems(
            withIds(
              (plan.lineItems as Array<{
                category: string;
                amount: number;
                note?: string;
                paid?: boolean;
              }>).map((i) => ({ ...i, paid: i.paid ?? false }))
            )
          );
          setIncomeHint("");
        } else {
          setSavedPlan(null);
          setLineItems([newLineItem()]);

          if (incomeResult.success && incomeResult.income > 0) {
            setIncome(incomeResult.income);
            setIncomeHint(
              `Based on ${formatCurrency(incomeResult.income)} income from previous ${currentMode === "monthly" ? "month" : "year"} (${currentMode === "monthly" ? formatMonthLabel(prevPeriod) : prevPeriod})`
            );
          } else {
            setIncome(0);
            setIncomeHint("");
          }
        }
      } catch {
        notify("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    fetchData(monthAndYear, mode);
  }, [fetchData, monthAndYear, mode]);

  const totalExpenses = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalPaid = lineItems
    .filter((i) => i.paid)
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const remaining = income - totalExpenses;
  const savingsRate = income > 0 ? (remaining / income) * 100 : 0;

  const paidItems = lineItems.filter((i) => i.paid);
  const hasExpenseData = lineItems.some((i) => i.category && i.amount > 0);
  const suggestions =
    income > 0 && hasExpenseData
      ? buildSuggestions(income, lineItems, totalExpenses, remaining, savingsRate)
      : [];

  const prevLineItems = prevPlan
    ? withIds(prevPlan.lineItems as Array<Omit<LineItem, "id"> & { id?: string }>)
    : [];
  const prevTotalExpenses = prevLineItems.reduce((sum, i) => sum + (i.amount || 0), 0);
  const prevRemaining = prevPlan ? prevPlan.income - prevTotalExpenses : 0;
  const prevSavingsRate =
    prevPlan && prevPlan.income > 0 ? (prevRemaining / prevPlan.income) * 100 : 0;

  function updateLineItem(
    index: number,
    field: keyof LineItem,
    value: string | number
  ) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [newLineItem()];
    });
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, newLineItem()]);
  }

  function markAsPaid(index: number) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, paid: true } : item))
    );
  }

  function undoPaid(index: number) {
    setLineItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, paid: false } : item))
    );
  }

  function importEMIs() {
    return runImportEMIs({ mode, lineItems, setLineItems, notify });
  }

  function resetForm() {
    setIncome(0);
    setIncomeHint("");
    setLineItems([newLineItem()]);
  }

  async function handleSave() {
    await handleSavePlan({
      income,
      lineItems,
      monthAndYear,
      mode,
      setSubmitting,
      notify,
      refresh: () => fetchData(monthAndYear, mode),
    });
  }

  async function handleDelete() {
    await handleDeletePlan({
      savedPlan,
      setSubmitting,
      setShowDeleteModal,
      setSavedPlan,
      resetForm,
      notify,
      refresh: () => fetchData(monthAndYear, mode),
    });
  }

  function handleModeChange(m: Mode) {
    setMode(m);
    setMonthAndYear(m === "monthly" ? getCurrentMonth() : getCurrentYear());
  }

  return {
    monthAndYear,
    mode,
    loading,
    submitting,
    income,
    incomeHint,
    lineItems,
    savedPlan,
    prevPlan,
    showDeleteModal,
    showSuggestionsModal,
    notification,
    notifLeaving,
    totalExpenses,
    totalPaid,
    remaining,
    savingsRate,
    paidItems,
    hasExpenseData,
    suggestions,
    prevLineItems,
    prevTotalExpenses,
    prevRemaining,
    prevSavingsRate,
    setMonthAndYear,
    setIncome,
    setShowDeleteModal,
    setShowSuggestionsModal,
    handleModeChange,
    updateLineItem,
    removeLineItem,
    addLineItem,
    markAsPaid,
    undoPaid,
    importEMIs,
    resetForm,
    handleSave,
    handleDelete,
    ...importPrev,
  };
}
