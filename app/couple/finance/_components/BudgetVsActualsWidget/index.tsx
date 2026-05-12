"use client";

import { useEffect, useState, useTransition } from "react";
import { getBudgetVsActuals } from "@/couple/finance/_actions/budget-vs-actuals";
import type { BudgetActualRow } from "@/couple/finance/_actions/budget-vs-actuals";
import {
  Card,
  CardTitle,
  RowList,
  Row,
  RowHeader,
  CategoryLabel,
  AmountLabel,
  TrackOuter,
  TrackFill,
  EmptyState,
} from "./_styled";

/** Returns "YYYY-MM" for the current month. */
function thisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Resolves the fill color based on the percentage consumed. */
function barColor(pct: number, noLimit: boolean): string {
  if (noLimit) return "var(--text-muted)";
  if (pct >= 100) return "var(--danger)";
  if (pct >= 70) return "#f59e0b"; // amber
  return "var(--accent)";
}

/**
 * Widget that shows budget limits vs actual spend for the current month.
 * Each category renders a horizontal progress bar coloured by consumption level.
 *
 * @returns A styled card with per-category budget vs actuals bars.
 */
export default function BudgetVsActualsWidget() {
  const [rows, setRows] = useState<BudgetActualRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      try {
        const data = await getBudgetVsActuals(thisMonth());
        setRows(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      }
    });
  }, []);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <Card>
      <CardTitle>Budget vs Actuals</CardTitle>

      {isPending && rows.length === 0 && (
        <EmptyState>Loading…</EmptyState>
      )}

      {error && <EmptyState>{error}</EmptyState>}

      {!isPending && !error && rows.length === 0 && (
        <EmptyState>No transactions or budgets for this month.</EmptyState>
      )}

      {rows.length > 0 && (
        <RowList>
          {rows.map((row) => {
            const noLimit = row.limit === null;
            const pct = noLimit ? 50 : row.pct; // dashed bar renders at 50% width
            const color = barColor(row.pct, noLimit);

            return (
              <Row key={row.category}>
                <RowHeader>
                  <CategoryLabel title={row.category}>{row.category}</CategoryLabel>
                  <AmountLabel>
                    {formatAmount(row.spent)}
                    {row.limit !== null ? ` / ${formatAmount(row.limit)}` : " (no budget)"}
                  </AmountLabel>
                </RowHeader>
                <TrackOuter>
                  <TrackFill $pct={pct} $color={color} $dashed={noLimit} />
                </TrackOuter>
              </Row>
            );
          })}
        </RowList>
      )}
    </Card>
  );
}
