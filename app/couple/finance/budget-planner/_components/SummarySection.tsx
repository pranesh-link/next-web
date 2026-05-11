"use client";

import styled from "styled-components";
import { SectionCard, SectionTitle } from "../_styled";
import { EASING, formatCurrency } from "../_utils";
import { Lightbulb } from "lucide-react";
import {
  SUMMARY_TITLE,
  SMART_SUGGESTIONS,
  INCOME_LABEL_MONTHLY,
  INCOME_LABEL_YEARLY,
  METRIC_TOTAL_ESTIMATED,
  METRIC_TOTAL_PAID,
  METRIC_REMAINING,
  METRIC_SAVINGS_RATE,
} from "../_labels";

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 16px;
  transition: all 0.3s ${EASING};

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
  }
`;

const MetricLabel = styled.p`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--text-muted);
  margin: 0 0 6px 0;
`;

const MetricValue = styled.p<{ $color?: string }>`
  font-size: 18px;
  font-weight: 800;
  color: ${(p) => p.$color ?? "var(--text)"};
  margin: 0;
  letter-spacing: -0.3px;

  @media (max-width: 480px) {
    font-size: 15px;
  }
`;

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const FlushSectionTitle = styled(SectionTitle)`
  margin: 0;
`;

const SuggestionsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface-hover);
    border-color: var(--accent);
    color: var(--accent);
  }
`;

type Props = {
  mode: "monthly" | "yearly";
  income: number;
  totalExpenses: number;
  totalPaid: number;
  remaining: number;
  savingsRate: number;
  suggestionsCount: number;
  onShowSuggestions: () => void;
};

export default function SummarySection({
  mode,
  income,
  totalExpenses,
  totalPaid,
  remaining,
  savingsRate,
  suggestionsCount,
  onShowSuggestions,
}: Props) {
  return (
    <SectionCard>
      <SectionTitleRow>
        <FlushSectionTitle>{SUMMARY_TITLE}</FlushSectionTitle>
        {suggestionsCount > 0 && (
          <SuggestionsButton onClick={onShowSuggestions}>
            <Lightbulb size={14} /> {SMART_SUGGESTIONS} ({suggestionsCount})
          </SuggestionsButton>
        )}
      </SectionTitleRow>
      <SummaryGrid>
        <MetricCard>
          <MetricLabel>{mode === "monthly" ? INCOME_LABEL_MONTHLY : INCOME_LABEL_YEARLY}</MetricLabel>
          <MetricValue>{formatCurrency(income)}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>{METRIC_TOTAL_ESTIMATED}</MetricLabel>
          <MetricValue>{formatCurrency(totalExpenses)}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>{METRIC_TOTAL_PAID}</MetricLabel>
          <MetricValue $color="#22c55e">{formatCurrency(totalPaid)}</MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>{METRIC_REMAINING}</MetricLabel>
          <MetricValue $color={remaining >= 0 ? "#22c55e" : "#ef4444"}>
            {formatCurrency(remaining)}
          </MetricValue>
        </MetricCard>
        <MetricCard>
          <MetricLabel>{METRIC_SAVINGS_RATE}</MetricLabel>
          <MetricValue
            $color={
              savingsRate > 30
                ? "#22c55e"
                : savingsRate >= 15
                  ? "#f59e0b"
                  : "#ef4444"
            }
          >
            {savingsRate.toFixed(1)}%
          </MetricValue>
        </MetricCard>
      </SummaryGrid>
    </SectionCard>
  );
}
