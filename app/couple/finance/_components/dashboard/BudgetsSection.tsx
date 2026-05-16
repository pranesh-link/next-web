"use client";

import styled from "styled-components";
import ProgressCard from "@/couple/_components/cards/ProgressCard";
import { Section, SectionHeader, BudgetGrid } from "./DashboardClient.styled";
import { formatCurrency } from "./utils";
import type { DashboardData } from "./types";

/** Container for the budget rollup summary bar. */
const RollupContainer = styled.div`
  margin-bottom: 24px;
`;

/** Background track for the rollup progress bar. */
const RollupBarTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: var(--surface-hover);
`;

/** Filled portion of the rollup progress bar. */
const RollupBarFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  border-radius: 4px;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: ${(p) => p.$color};
  transition: width 1s;
`;

/** Flex row of rollup stats beneath the bar. */
const RollupStats = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

/** Individual stat label + value. */
const RollupStat = styled.span<{ $danger?: boolean }>`
  font-size: 13px;
  color: ${(p) => (p.$danger ? "var(--danger)" : "var(--text-muted)")};
`;

/** Bold value within a rollup stat. */
const RollupStatValue = styled.span<{ $danger?: boolean }>`
  font-weight: 600;
  color: ${(p) => (p.$danger ? "var(--danger)" : "var(--text)")};
`;

/** Returns the bar color based on adherence percentage. */
function getBarColor(adherence: number): string {
  if (adherence > 100) return "var(--danger)";
  if (adherence >= 80) return "#f59e0b";
  return "var(--accent)";
}

/** Dashboard section displaying budget status with a rollup summary bar. */
export default function BudgetsSection({
  budgetStatus,
  budgetRollup,
}: {
  budgetStatus: DashboardData["budgetStatus"];
  budgetRollup: DashboardData["budgetRollup"];
}) {
  if (budgetStatus.length === 0) return null;

  return (
    <Section>
      <SectionHeader>Budget Status</SectionHeader>
      <RollupContainer>
        <RollupBarTrack>
          <RollupBarFill
            $width={budgetRollup.adherencePercent}
            $color={getBarColor(budgetRollup.adherencePercent)}
          />
        </RollupBarTrack>
        <RollupStats>
          <RollupStat>
            Budgeted:{" "}
            <RollupStatValue>
              {formatCurrency(budgetRollup.totalBudgeted)}
            </RollupStatValue>
          </RollupStat>
          <RollupStat>
            Spent:{" "}
            <RollupStatValue>
              {formatCurrency(budgetRollup.totalSpent)}
            </RollupStatValue>
          </RollupStat>
          <RollupStat $danger={budgetRollup.remaining < 0}>
            Remaining:{" "}
            <RollupStatValue $danger={budgetRollup.remaining < 0}>
              {formatCurrency(budgetRollup.remaining)}
            </RollupStatValue>
          </RollupStat>
          {budgetRollup.overBudgetCount > 0 && (
            <RollupStat $danger>
              <RollupStatValue $danger>
                {budgetRollup.overBudgetCount} over budget
              </RollupStatValue>
            </RollupStat>
          )}
        </RollupStats>
      </RollupContainer>
      <BudgetGrid>
        {budgetStatus.map((item) => (
          <ProgressCard
            key={item.budget.id}
            title={item.budget.category}
            current={item.spent}
            target={item.budget.limit}
            color={item.exceeded ? "var(--danger)" : undefined}
          />
        ))}
      </BudgetGrid>
    </Section>
  );
}
