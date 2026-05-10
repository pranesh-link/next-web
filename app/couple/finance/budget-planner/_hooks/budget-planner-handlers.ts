"use client";

/**
 * Pure handler helpers for the budget planner hook.
 *
 * Extracted from `useBudgetPlanner.ts` to keep that hook under the 300-line
 * cap. Each helper takes the small slice of state/setters it needs so the
 * hook only orchestrates calls.
 */

import {
  deleteBudgetPlan,
  getActiveLoans,
  saveBudgetPlan,
} from "@/couple/finance/_actions/budget-plans";
import { newLineItem, type LineItem, type SavedPlan } from "../_utils";
import type { Mode } from "./useBudgetPlanner";

type Notify = (
  message: string,
  type: "success" | "error",
) => void;

/**
 * Import active-loan EMIs as new expense line items.
 *
 * @param params - Bag carrying the current mode, line items, and a setter
 *   plus the shared notify callback.
 * @returns A promise resolved once the import attempt completes (success or
 *   failure is surfaced via `notify`).
 */
export async function importEMIs(params: {
  mode: Mode;
  lineItems: LineItem[];
  setLineItems: React.Dispatch<React.SetStateAction<LineItem[]>>;
  notify: Notify;
}): Promise<void> {
  const { mode, lineItems, setLineItems, notify } = params;
  const result = await getActiveLoans();
  if (!result.success || !result.data) {
    notify(result.error || "Failed to fetch loans", "error");
    return;
  }
  if (result.data.length === 0) {
    notify("No active loans found", "error");
    return;
  }

  const existingEMINotes = new Set(
    lineItems.filter((i) => i.category === "EMI" && i.note).map((i) => i.note),
  );

  const newItems = result.data
    .filter((loan) => !existingEMINotes.has(loan.name))
    .map((loan: { name: string; emiAmount: number; nextEmiAmount?: number }) =>
      newLineItem({
        category: "EMI",
        amount:
          mode === "yearly"
            ? (loan.nextEmiAmount ?? loan.emiAmount) * 12
            : (loan.nextEmiAmount ?? loan.emiAmount),
        note: loan.name,
        paid: false,
      }),
    );

  if (newItems.length === 0) {
    notify("All loan EMIs already imported", "info" as "success");
    return;
  }

  setLineItems((prev) => {
    const cleaned = prev.filter((i) => i.category !== "" || i.amount > 0);
    return cleaned.length > 0 ? [...cleaned, ...newItems] : newItems;
  });
  notify(`Imported ${newItems.length} loan EMI(s)`, "success");
}

/**
 * Validate inputs and persist the budget plan.
 *
 * @param params - State, setters, and callbacks needed to save.
 * @returns A promise resolving once save completes.
 */
export async function handleSavePlan(params: {
  income: number;
  lineItems: LineItem[];
  monthAndYear: string;
  mode: Mode;
  setSubmitting: (v: boolean) => void;
  notify: Notify;
  refresh: () => Promise<void>;
}): Promise<void> {
  const {
    income,
    lineItems,
    monthAndYear,
    mode,
    setSubmitting,
    notify,
    refresh,
  } = params;

  if (income <= 0) {
    notify("Please enter a valid income", "error");
    return;
  }

  const validItems = lineItems.filter((i) => i.category && i.amount > 0);
  if (validItems.length === 0) {
    notify("Add at least one expense with a category and amount", "error");
    return;
  }

  const missingNotes = validItems.some((i) => !i.note?.trim());
  if (missingNotes) {
    notify("Please add a note for each expense item", "error");
    return;
  }

  setSubmitting(true);
  const result = await saveBudgetPlan({
    monthAndYear,
    mode,
    income,
    lineItems: validItems.map((i) => ({
      category: i.category,
      amount: i.amount,
      paid: i.paid ?? false,
      ...(i.note ? { note: i.note } : {}),
    })),
  });
  setSubmitting(false);

  if (!result) {
    notify("App was updated. Please reload (Cmd+Shift+R).", "error");
    return;
  }

  if (result.success) {
    notify("Budget plan saved!", "success");
    await refresh();
  } else {
    notify(result.error, "error");
  }
}

/**
 * Delete the saved budget plan and reset local state on success.
 *
 * @param params - State, setters, and callbacks needed for delete.
 * @returns A promise resolving once delete completes.
 */
export async function handleDeletePlan(params: {
  savedPlan: SavedPlan | null;
  setSubmitting: (v: boolean) => void;
  setShowDeleteModal: (v: boolean) => void;
  setSavedPlan: (v: SavedPlan | null) => void;
  resetForm: () => void;
  notify: Notify;
  refresh: () => Promise<void>;
}): Promise<void> {
  const {
    savedPlan,
    setSubmitting,
    setShowDeleteModal,
    setSavedPlan,
    resetForm,
    notify,
    refresh,
  } = params;

  if (!savedPlan) return;
  setSubmitting(true);
  setShowDeleteModal(false);

  const result = await deleteBudgetPlan(savedPlan.id);
  setSubmitting(false);

  if (!result) {
    notify("App was updated. Please reload (Cmd+Shift+R).", "error");
    return;
  }

  if (result.success) {
    notify("Budget plan deleted", "success");
    setSavedPlan(null);
    resetForm();
    await refresh();
  } else {
    notify(result.error, "error");
  }
}
