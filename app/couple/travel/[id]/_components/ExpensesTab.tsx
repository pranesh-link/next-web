"use client";

import { useState } from "react";
import {
  addTripExpense,
  deleteTripExpense,
} from "@/couple/travel/_actions/expenses";
import type { TripExpense } from "../../_types";
import {
  EmptyHint,
  AddItemBtn,
  InlineForm,
  TabInput,
  SmallPrimaryBtn,
  SmallGhostBtn,
  DeleteBtn,
} from "../_styled";
import {
  SummaryBar,
  SummaryLabel,
  SummaryAmount,
  ProgressTrack,
  ProgressFill,
  ExpenseList,
  ExpenseRow,
  ExpenseInfo,
  ExpenseTitle,
  ExpenseMeta,
  ExpenseAmount,
  CategoryBreakdown,
  CategoryRow,
} from "./_styled-expenses";

const EMPTY = { title: "", amount: "", category: "", date: "" };

interface ExpensesTabProps {
  /** ID of the parent trip. */
  tripId: string;
  /** Current expenses from the parent fetch. */
  expenses: TripExpense[];
  /** Optional trip budget for the summary bar. */
  budget: number | null;
  /** Callback to re-fetch parent trip data after a mutation. */
  onRefresh: () => Promise<void>;
}

/** Displays and manages trip expenses with a budget summary. */
export default function ExpensesTab({
  tripId,
  expenses,
  budget,
  onRefresh,
}: ExpensesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const budgetPct = budget ? (total / budget) * 100 : 0;
  const isOver = budget != null && total > budget;

  const byCategory: Record<string, number> = {};
  for (const e of expenses) {
    const cat = e.category ?? "Other";
    byCategory[cat] = (byCategory[cat] ?? 0) + e.amount;
  }

  function setField(key: keyof typeof EMPTY, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function fmt(n: number) {
    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.amount || !form.date) return;
    setSubmitting(true);
    await addTripExpense(tripId, {
      title: form.title,
      amount: Number(form.amount),
      category: form.category || undefined,
      date: form.date,
    });
    await onRefresh();
    setForm(EMPTY);
    setShowForm(false);
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    await deleteTripExpense(id);
    await onRefresh();
  }

  return (
    <div>
      {budget != null && (
        <SummaryBar>
          <div>
            <SummaryLabel>Total Spent</SummaryLabel>
            <SummaryAmount $over={isOver}>{fmt(total)}</SummaryAmount>
            <ProgressTrack>
              <ProgressFill $pct={budgetPct} $over={isOver} />
            </ProgressTrack>
          </div>
          <div>
            <SummaryLabel>Budget</SummaryLabel>
            <SummaryAmount $over={false}>{fmt(budget)}</SummaryAmount>
          </div>
        </SummaryBar>
      )}

      {expenses.length === 0 ? (
        <EmptyHint>No expenses recorded yet.</EmptyHint>
      ) : (
        <ExpenseList>
          {expenses.map((exp) => (
            <ExpenseRow key={exp.id}>
              <ExpenseInfo>
                <ExpenseTitle>{exp.title}</ExpenseTitle>
                <ExpenseMeta>
                  {exp.category ?? "Uncategorized"} ·{" "}
                  {new Date(exp.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  })}
                </ExpenseMeta>
              </ExpenseInfo>
              <ExpenseAmount>{fmt(exp.amount)}</ExpenseAmount>
              <DeleteBtn
                type="button"
                onClick={() => handleDelete(exp.id)}
                aria-label="Delete expense"
              >
                ✕
              </DeleteBtn>
            </ExpenseRow>
          ))}
        </ExpenseList>
      )}

      {Object.keys(byCategory).length > 0 && (
        <CategoryBreakdown>
          <h4>By Category</h4>
          {Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amt]) => (
              <CategoryRow key={cat}>
                <span>{cat}</span>
                <span>{fmt(amt)}</span>
              </CategoryRow>
            ))}
        </CategoryBreakdown>
      )}

      {showForm ? (
        <InlineForm onSubmit={handleAdd}>
          <TabInput
            placeholder="Title *"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            required
          />
          <TabInput
            type="number"
            placeholder="Amount *"
            value={form.amount}
            onChange={(e) => setField("amount", e.target.value)}
            min={0}
            step="0.01"
            required
          />
          <TabInput
            placeholder="Category"
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
          />
          <TabInput
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            required
          />
          <SmallPrimaryBtn type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add"}
          </SmallPrimaryBtn>
          <SmallGhostBtn
            type="button"
            onClick={() => {
              setShowForm(false);
              setForm(EMPTY);
            }}
          >
            Cancel
          </SmallGhostBtn>
        </InlineForm>
      ) : (
        <AddItemBtn type="button" onClick={() => setShowForm(true)}>
          + Add Expense
        </AddItemBtn>
      )}
    </div>
  );
}
