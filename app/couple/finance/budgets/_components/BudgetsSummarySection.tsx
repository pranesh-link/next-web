"use client";

import {
  SummaryRow,
  SummaryCard,
  SummaryLabel,
  SummaryValue,
} from "../_styled";
import { formatCurrency } from "../_utils";

type Props = {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
};

export default function BudgetsSummarySection({
  totalBudgeted,
  totalSpent,
  totalRemaining,
}: Props) {
  return (
    <SummaryRow>
      <SummaryCard>
        <SummaryLabel>Total Budgeted</SummaryLabel>
        <SummaryValue>{formatCurrency(totalBudgeted)}</SummaryValue>
      </SummaryCard>
      <SummaryCard>
        <SummaryLabel>Total Spent</SummaryLabel>
        <SummaryValue
          $color={
            totalSpent > totalBudgeted ? "var(--danger)" : "var(--text)"
          }
        >
          {formatCurrency(totalSpent)}
        </SummaryValue>
      </SummaryCard>
      <SummaryCard>
        <SummaryLabel>Total Remaining</SummaryLabel>
        <SummaryValue
          $color={totalRemaining < 0 ? "var(--danger)" : "var(--success)"}
        >
          {formatCurrency(totalRemaining)}
        </SummaryValue>
      </SummaryCard>
    </SummaryRow>
  );
}
