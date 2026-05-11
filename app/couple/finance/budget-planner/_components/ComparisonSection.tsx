"use client";

import styled from "styled-components";
import { SectionCard, SectionTitle, MutedText } from "../_styled";
import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { COMPARISON_MONTHLY, COMPARISON_YEARLY, INCOME, EXPENSES, SAVINGS, METRIC_SAVINGS_RATE, CATEGORY_BREAKDOWN, NO_PLAN_SAVED_PREFIX, SAVE_PLANS_HINT_MONTHLY, SAVE_PLANS_HINT_YEARLY } from "../_labels";
import {
  categoryAmount,
  deltaPercent,
  formatCurrency,
  formatMonthLabel,
  shiftMonth,
  shiftYear,
  type LineItem,
  type SavedPlan,
} from "../_utils";

const SubSectionTitle = styled(SectionTitle)`
  font-size: 14px;
  margin: 8px 0 16px 0;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ComparisonCard = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
`;

const ComparisonLabel = styled.p`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin: 0 0 6px 0;
`;

const ComparisonValues = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const ComparisonFrom = styled.span`
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: line-through;
`;

const ComparisonArrow = styled.span`
  font-size: 11px;
  color: var(--text-muted);
`;

const ComparisonTo = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
`;

const DeltaIndicator = styled.span<{ $positive: boolean }>`
  font-size: 11px;
  font-weight: 700;
  color: ${(p) => (p.$positive ? "#22c55e" : "#ef4444")};
  background: ${(p) =>
    p.$positive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"};
  padding: 2px 7px;
  border-radius: 6px;
`;

const InsightBanner = styled.div<{ $positive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  background: ${(p) =>
    p.$positive ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)"};
  border: 1px solid
    ${(p) =>
      p.$positive ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"};
  color: ${(p) => (p.$positive ? "#15803d" : "#b91c1c")};
`;

const CategoryDiffGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const CategoryDiffItem = styled.div<{ $flagged: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid
    ${(p) => (p.$flagged ? "rgba(245, 158, 11, 0.3)" : "var(--border)")};
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
`;

// Local helper used only by this component
function getCategoryDiffs(
  prevPlan: SavedPlan | null,
  prevLineItems: LineItem[],
  lineItems: LineItem[]
): Array<{
  category: string;
  prev: number;
  current: number;
  delta: number;
  flagged: boolean;
}> {
  if (!prevPlan) return [];
  const allCategories = new Set<string>();
  prevLineItems.forEach((i) => allCategories.add(i.category));
  lineItems.forEach((i) => {
    if (i.category) allCategories.add(i.category);
  });

  return Array.from(allCategories)
    .map((cat) => {
      const prev = categoryAmount(prevLineItems, cat);
      const current = categoryAmount(lineItems, cat);
      const delta = deltaPercent(prev, current);
      return { category: cat, prev, current, delta, flagged: delta > 20 };
    })
    .filter((d) => d.prev > 0 || d.current > 0);
}

type Props = {
  mode: "monthly" | "yearly";
  monthAndYear: string;
  income: number;
  hasExpenseData: boolean;
  totalExpenses: number;
  remaining: number;
  savingsRate: number;
  prevPlan: SavedPlan | null;
  prevLineItems: LineItem[];
  prevTotalExpenses: number;
  prevRemaining: number;
  prevSavingsRate: number;
  lineItems: LineItem[];
};

export default function ComparisonSection({
  mode,
  monthAndYear,
  income,
  hasExpenseData,
  totalExpenses,
  remaining,
  savingsRate,
  prevPlan,
  prevLineItems,
  prevTotalExpenses,
  prevRemaining,
  prevSavingsRate,
  lineItems,
}: Props) {
  return (
    <SectionCard>
      <SectionTitle>
        {mode === "monthly" ? COMPARISON_MONTHLY : COMPARISON_YEARLY}
      </SectionTitle>
      {prevPlan && income > 0 && hasExpenseData ? (
        <>
          {totalExpenses !== prevTotalExpenses && (
            <InsightBanner $positive={totalExpenses < prevTotalExpenses}>
              {totalExpenses < prevTotalExpenses ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}{" "}
              Total expenses{" "}
              {totalExpenses < prevTotalExpenses ? "decreased" : "increased"}{" "}
              compared to last {mode === "monthly" ? "month" : "year"}
              {" · "}
              {Math.abs(deltaPercent(prevTotalExpenses, totalExpenses)).toFixed(1)}%
            </InsightBanner>
          )}
          <ComparisonGrid>
            <ComparisonCard>
              <ComparisonLabel>{INCOME}</ComparisonLabel>
              <ComparisonValues>
                <ComparisonFrom>{formatCurrency(prevPlan.income)}</ComparisonFrom>
                <ComparisonArrow>→</ComparisonArrow>
                <ComparisonTo>{formatCurrency(income)}</ComparisonTo>
              </ComparisonValues>
              <DeltaIndicator $positive={income >= prevPlan.income}>
                {income >= prevPlan.income ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{" "}
                {Math.abs(deltaPercent(prevPlan.income, income)).toFixed(1)}%
              </DeltaIndicator>
            </ComparisonCard>

            <ComparisonCard>
              <ComparisonLabel>{EXPENSES}</ComparisonLabel>
              <ComparisonValues>
                <ComparisonFrom>{formatCurrency(prevTotalExpenses)}</ComparisonFrom>
                <ComparisonArrow>→</ComparisonArrow>
                <ComparisonTo>{formatCurrency(totalExpenses)}</ComparisonTo>
              </ComparisonValues>
              <DeltaIndicator $positive={totalExpenses <= prevTotalExpenses}>
                {totalExpenses <= prevTotalExpenses ? <TrendingDown size={12} /> : <TrendingUp size={12} />}{" "}
                {Math.abs(deltaPercent(prevTotalExpenses, totalExpenses)).toFixed(1)}%
              </DeltaIndicator>
            </ComparisonCard>

            <ComparisonCard>
              <ComparisonLabel>{SAVINGS}</ComparisonLabel>
              <ComparisonValues>
                <ComparisonFrom>{formatCurrency(prevRemaining)}</ComparisonFrom>
                <ComparisonArrow>→</ComparisonArrow>
                <ComparisonTo>{formatCurrency(remaining)}</ComparisonTo>
              </ComparisonValues>
              <DeltaIndicator $positive={remaining >= prevRemaining}>
                {remaining >= prevRemaining ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{" "}
                {Math.abs(deltaPercent(prevRemaining, remaining)).toFixed(1)}%
              </DeltaIndicator>
            </ComparisonCard>

            <ComparisonCard>
              <ComparisonLabel>{METRIC_SAVINGS_RATE}</ComparisonLabel>
              <ComparisonValues>
                <ComparisonFrom>{prevSavingsRate.toFixed(1)}%</ComparisonFrom>
                <ComparisonArrow>→</ComparisonArrow>
                <ComparisonTo>{savingsRate.toFixed(1)}%</ComparisonTo>
              </ComparisonValues>
              <DeltaIndicator $positive={savingsRate >= prevSavingsRate}>
                {savingsRate >= prevSavingsRate ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{" "}
                {Math.abs(savingsRate - prevSavingsRate).toFixed(1)}pp
              </DeltaIndicator>
            </ComparisonCard>
          </ComparisonGrid>

          {getCategoryDiffs(prevPlan, prevLineItems, lineItems).length > 0 && (
            <>
              <SubSectionTitle>{CATEGORY_BREAKDOWN}</SubSectionTitle>
              <CategoryDiffGrid>
                {getCategoryDiffs(prevPlan, prevLineItems, lineItems).map((d) => (
                  <CategoryDiffItem key={d.category} $flagged={d.flagged}>
                    <span>{d.category}</span>
                    <DeltaIndicator $positive={d.delta <= 0}>
                      {d.delta <= 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />} {Math.abs(d.delta).toFixed(0)}%
                      {d.flagged && <>{" "}<AlertTriangle size={12} /></>}
                    </DeltaIndicator>
                  </CategoryDiffItem>
                ))}
              </CategoryDiffGrid>
            </>
          )}
        </>
      ) : (
        <MutedText>
          {NO_PLAN_SAVED_PREFIX}{" "}
          {mode === "monthly"
            ? formatMonthLabel(shiftMonth(monthAndYear, -1))
            : shiftYear(monthAndYear, -1)}
          .{" "}
          {mode === "monthly" ? SAVE_PLANS_HINT_MONTHLY : SAVE_PLANS_HINT_YEARLY}
        </MutedText>
      )}
    </SectionCard>
  );
}
