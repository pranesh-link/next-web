"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import {
  getIncome,
  getBudgetPlan,
  saveBudgetPlan,
  deleteBudgetPlan,
  getActiveLoans,
} from "@/couple/finance/_actions/budget-plans";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import Modal from "@/couple/_components/shared/Modal";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

/* ── Types ──────────────────────────────────────────── */

type LineItem = { category: string; amount: number; note?: string };

type SavedPlan = {
  id: string;
  monthAndYear: string;
  mode: string;
  income: number;
  lineItems: unknown;
  paidItems: unknown;
  coupleId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type Notification = {
  message: string;
  type: "success" | "error";
};

type Suggestion = {
  icon: string;
  text: string;
  type: "warning" | "info" | "success" | "danger";
};

/* ── Constants ──────────────────────────────────────── */

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

const CATEGORIES = [
  "Food",
  "Rent",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "EMI",
  "Credit Card",
  "Utilities",
  "Emergency Fund",
  "Other",
] as const;

/* ── Helpers ────────────────────────────────────────── */

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getCurrentYear(): string {
  return String(new Date().getFullYear());
}

function formatYearLabel(year: string): string {
  return year;
}

function shiftYear(year: string, delta: number): string {
  return String(Number(year) + delta);
}

function formatCurrency(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function categoryAmount(items: LineItem[], cat: string): number {
  return items
    .filter((i) => i.category === cat)
    .reduce((sum, i) => sum + i.amount, 0);
}

function buildSuggestions(
  income: number,
  items: LineItem[],
  totalExpenses: number,
  remaining: number,
  savingsRate: number
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (savingsRate < 10) {
    suggestions.push({
      icon: "⚠️",
      text: "Your savings are critically low. Review discretionary spending (Shopping, Entertainment).",
      type: "warning",
    });
  } else if (savingsRate < 20) {
    suggestions.push({
      icon: "💡",
      text: "Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
      type: "info",
    });
  } else if (savingsRate < 30) {
    suggestions.push({
      icon: "✅",
      text: "Good savings rate! Consider SIPs or recurring deposits for wealth building.",
      type: "success",
    });
  } else {
    suggestions.push({
      icon: "🎯",
      text: "Excellent! Diversify into equity SIPs, PPF, NPS for long-term growth.",
      type: "success",
    });
  }

  if (categoryAmount(items, "Rent") > income * 0.3) {
    suggestions.push({
      icon: "🏠",
      text: "Housing exceeds 30% of income — consider if downsizing is feasible.",
      type: "warning",
    });
  }

  if (categoryAmount(items, "EMI") > income * 0.4) {
    suggestions.push({
      icon: "💳",
      text: "Debt payments exceed 40% of income. Prioritize clearing high-interest loans.",
      type: "warning",
    });
  }

  if (!items.some((i) => i.category === "Emergency Fund")) {
    suggestions.push({
      icon: "🛡️",
      text: "Add an Emergency Fund contribution (aim for 3-6 months of expenses).",
      type: "info",
    });
  }

  if (categoryAmount(items, "Entertainment") > income * 0.15) {
    suggestions.push({
      icon: "🎬",
      text: "Entertainment spending is high — try capping it at 10% of income.",
      type: "warning",
    });
  }

  const ccAmount = categoryAmount(items, "Credit Card");
  if (ccAmount > income) {
    suggestions.push({
      icon: "🚨",
      text: "Credit card spend exceeds income — you'll carry forward debt. Reduce discretionary usage.",
      type: "danger",
    });
  } else if (ccAmount > income * 0.3) {
    suggestions.push({
      icon: "💳",
      text: "Credit card spending is high. Pay full statement balance to avoid 36-42% APR charges.",
      type: "warning",
    });
  }

  if (items.some((i) => i.category === "Credit Card")) {
    suggestions.push({
      icon: "💡",
      text: "Always pay credit card bills in full. Minimum payments compound at 3-4% per month.",
      type: "info",
    });
  }

  if (remaining >= 1000 && remaining < 5000) {
    suggestions.push({
      icon: "📈",
      text: "Start a ₹500-1000/month SIP in an index fund.",
      type: "info",
    });
  } else if (remaining >= 5000 && remaining < 15000) {
    suggestions.push({
      icon: "📈",
      text: "Split: 60% SIP (equity mutual fund), 20% PPF/NPS, 20% liquid fund.",
      type: "info",
    });
  } else if (remaining >= 15000 && remaining < 50000) {
    suggestions.push({
      icon: "📈",
      text: "Diversify: SIP (40%), PPF (20%), FD/RD (20%), gold ETF (10%), emergency fund (10%).",
      type: "info",
    });
  } else if (remaining >= 50000) {
    suggestions.push({
      icon: "📈",
      text: "Consider: large-cap + mid-cap SIPs, NPS for tax benefit, direct equity, and REITs.",
      type: "info",
    });
  }

  return suggestions;
}

/* ── Keyframes ──────────────────────────────────────── */

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Styled Components ──────────────────────────────── */

const PageWrapper = styled.div`
  padding: 32px;
  max-width: 100%;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

/* ── Mode Toggle ── */

const ModeToggle = styled.div`
  display: inline-flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  background: ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : "var(--text-muted)")};

  &:hover {
    background: ${(p) => (p.$active ? "var(--accent)" : "var(--surface-hover)")};
  }
`;

/* ── Month Selector ── */

const MonthSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const MonthArrowButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface-hover);
    border-color: var(--border-strong);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const MonthLabel = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.3px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

const MonthInput = styled.input`
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ${EASING};

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`;

const SavedBadge = styled.span`
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.3px;
`;

/* ── Section Cards ── */

const SectionCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  transition: all 0.3s ${EASING};

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 16px 0;
  letter-spacing: -0.3px;
`;

/* ── Income ── */

const IncomeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
`;

const FinanceInput = styled.input`
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text);
  transition: border-color 0.2s ${EASING};
  min-width: 0;
  flex: 1;
  max-width: 300px;

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: var(--text-muted);
  }

  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

const FinanceSelect = styled.select`
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text);
  transition: border-color 0.2s ${EASING};
  min-width: 0;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;

  &:focus {
    outline: none;
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const InputLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
`;

const IncomeHint = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  margin: 8px 0 0 0;
  font-style: italic;
`;

/* ── Line Items ── */

const LineItemGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const LineItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  animation: ${fadeIn} 0.3s ${EASING};
  min-width: 0;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const LineItemField = styled.div<{ $flex?: number }>`
  flex: ${(p) => p.$flex ?? 1};
  min-width: 0;

  @media (max-width: 768px) {
    flex-basis: ${(p) => (p.$flex && p.$flex >= 2 ? "100%" : "calc(50% - 5px)")};
  }
`;

const RemoveButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.2s ${EASING};

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: var(--danger);
  }
`;

const ExpenseActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  background: transparent;
  color: var(--accent);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: rgba(59, 130, 246, 0.05);
    border-color: var(--accent);
  }
`;

const TotalRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  margin-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
`;

/* ── Summary Grid ── */

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
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ${EASING};

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
  }
`;

const MetricLabel = styled.p`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
`;

const MetricValue = styled.p<{ $color?: string }>`
  font-size: 22px;
  font-weight: 800;
  color: ${(p) => p.$color ?? "var(--text)"};
  margin: 0;
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

/* ── Suggestions ── */

const SuggestionCard = styled.div<{ $accentColor: string }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-left: 4px solid ${(p) => p.$accentColor};
  border-radius: 10px;
  margin-bottom: 10px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

const SuggestionIcon = styled.span`
  font-size: 18px;
  flex-shrink: 0;
  line-height: 1.4;
`;

const SuggestionText = styled.p`
  font-size: 14px;
  color: var(--text);
  margin: 0;
  line-height: 1.5;
`;

/* ── Paid Section ── */

const PaidSectionCard = styled(SectionCard)`
  border-left: 4px solid #22c55e;
`;

const PaidItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  animation: ${fadeIn} 0.3s ${EASING};

  &:last-of-type {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const PaidItemInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const PaidCategory = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
`;

const PaidNote = styled.span`
  font-size: 13px;
  color: var(--text-muted);
`;

const PaidAmount = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #22c55e;
  white-space: nowrap;
`;

const UndoButton = styled.button`
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  white-space: nowrap;

  &:hover {
    background: rgba(239, 68, 68, 0.05);
    border-color: rgba(239, 68, 68, 0.3);
    color: var(--danger);
  }
`;

const MarkPaidButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.2s ${EASING};

  &:hover:not(:disabled) {
    background: rgba(34, 197, 94, 0.1);
    border-color: rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
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

/* ── Comparison ── */

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
  border-radius: 12px;
  padding: 16px;
`;

const ComparisonLabel = styled.p`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
`;

const ComparisonValues = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ComparisonFrom = styled.span`
  font-size: 14px;
  color: var(--text-muted);
  text-decoration: line-through;
`;

const ComparisonArrow = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

const ComparisonTo = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
`;

const DeltaIndicator = styled.span<{ $positive: boolean }>`
  font-size: 12px;
  font-weight: 700;
  color: ${(p) => (p.$positive ? "#22c55e" : "#ef4444")};
  background: ${(p) =>
    p.$positive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"};
  padding: 2px 8px;
  border-radius: 6px;
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

const MutedText = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
  text-align: center;
  padding: 16px 0;
`;

/* ── Action Bar ── */

const ActionBar = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  padding: 12px 28px;
  border-radius: 10px;
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const OutlineButton = styled.button`
  padding: 12px 28px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface-hover);
    transform: translateY(-1px);
  }
`;

const DangerButton = styled.button`
  padding: 12px 28px;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: rgba(239, 68, 68, 0.2);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

/* ── Notification ── */

const NotificationBanner = styled.div<{
  $type: "success" | "error";
  $leaving: boolean;
}>`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: ${(p) =>
    p.$type === "success"
      ? "rgba(34, 197, 94, 0.15)"
      : "rgba(239, 68, 68, 0.15)"};
  border: 1px solid
    ${(p) =>
      p.$type === "success"
        ? "rgba(34, 197, 94, 0.4)"
        : "rgba(239, 68, 68, 0.4)"};
  color: ${(p) =>
    p.$type === "success" ? "#22c55e" : "var(--danger)"};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  max-width: calc(100vw - 32px);
  box-sizing: border-box;
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
  pointer-events: none;
`;

/* ── Modal helpers ── */

const ConfirmBody = styled.div`
  text-align: center;
`;

const ConfirmText = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

const OverwriteWarning = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 20px 0;
  line-height: 1.5;
  font-style: italic;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const ConfirmButton = styled.button<{ $variant: "danger" | "cancel" | "primary" }>`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  background: ${(p) =>
    p.$variant === "danger"
      ? "var(--danger)"
      : p.$variant === "primary"
        ? "var(--accent)"
        : "var(--surface)"};
  color: ${(p) =>
    p.$variant === "cancel" ? "var(--text)" : "#fff"};
  border: 1px solid
    ${(p) =>
      p.$variant === "danger"
        ? "var(--danger)"
        : p.$variant === "primary"
          ? "var(--accent)"
          : "var(--border)"};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

/* ── Component ──────────────────────────────────────── */

export default function BudgetPlannerPage() {
  /* State */
  const [monthAndYear, setMonthAndYear] = useState(getCurrentMonth);
  const [mode, setMode] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [income, setIncome] = useState(0);
  const [incomeHint, setIncomeHint] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { category: "", amount: 0 },
  ]);

  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(null);
  const [prevPlan, setPrevPlan] = useState<SavedPlan | null>(null);

  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [paidItems, setPaidItems] = useState<LineItem[]>([]);

  const [notification, setNotification] = useState<Notification | null>(null);
  const [notifLeaving, setNotifLeaving] = useState(false);
  const notifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* ── Notification helper ── */

  const notify = useCallback((message: string, type: "success" | "error") => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotifLeaving(false);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => {
      setNotifLeaving(true);
      setTimeout(() => setNotification(null), 300);
    }, 3000);
  }, []);

  /* ── Data fetching ── */

  const fetchData = useCallback(async (month: string, currentMode: "monthly" | "yearly") => {
    setLoading(true);
    try {
      const prevPeriod = currentMode === "monthly" ? shiftMonth(month, -1) : shiftYear(month, -1);
      const [planResult, prevPlanResult, incomeResult] = await Promise.all([
        getBudgetPlan(month, currentMode),
        getBudgetPlan(prevPeriod, currentMode),
        getIncome(prevPeriod, currentMode),
      ]);

      // Previous month plan
      if (prevPlanResult.success && prevPlanResult.data) {
        setPrevPlan(prevPlanResult.data);
      } else {
        setPrevPlan(null);
      }

      // Current month plan
      if (planResult.success && planResult.data) {
        const plan = planResult.data;
        setSavedPlan(plan);
        setIncome(plan.income);
        setLineItems(
          plan.lineItems as Array<{
            category: string;
            amount: number;
            note?: string;
          }>
        );
        setPaidItems(
          (plan.paidItems as Array<{
            category: string;
            amount: number;
            note?: string;
          }>) ?? []
        );
        setIncomeHint("");
      } else {
        setSavedPlan(null);
        setLineItems([{ category: "", amount: 0 }]);
        setPaidItems([]);

        // Auto-fill income from transactions
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
  }, [notify]);

  useEffect(() => {
    fetchData(monthAndYear, mode);
  }, [fetchData, monthAndYear, mode]);

  /* ── Computed values ── */

  const totalExpenses = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalPaid = paidItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const remaining = income - totalExpenses - totalPaid;
  const savingsRate = income > 0 ? (remaining / income) * 100 : 0;

  const hasExpenseData = lineItems.some((i) => i.category && i.amount > 0);
  const suggestions =
    income > 0 && hasExpenseData
      ? buildSuggestions(income, lineItems, totalExpenses, remaining, savingsRate)
      : [];

  /* Previous month computations */
  const prevLineItems = prevPlan
    ? (prevPlan.lineItems as LineItem[])
    : [];
  const prevTotalExpenses = prevLineItems.reduce(
    (sum, i) => sum + (i.amount || 0),
    0
  );
  const prevRemaining = prevPlan ? prevPlan.income - prevTotalExpenses : 0;
  const prevSavingsRate =
    prevPlan && prevPlan.income > 0
      ? (prevRemaining / prevPlan.income) * 100
      : 0;

  /* ── Line-item handlers ── */

  function updateLineItem(
    index: number,
    field: keyof LineItem,
    value: string | number
  ) {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.length > 0 ? filtered : [{ category: "", amount: 0 }];
    });
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { category: "", amount: 0 }]);
  }

  function markAsPaid(index: number) {
    const item = lineItems[index];
    if (!item.category || !item.amount) return;
    setPaidItems((prev) => [...prev, item]);
    removeLineItem(index);
  }

  function undoPaid(index: number) {
    const item = paidItems[index];
    setPaidItems((prev) => prev.filter((_, i) => i !== index));
    setLineItems((prev) => [...prev, item]);
  }

  async function importEMIs() {
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
      lineItems.filter((i) => i.category === "EMI" && i.note).map((i) => i.note)
    );

    const newItems = result.data
      .filter((loan) => !existingEMINotes.has(loan.name))
      .map((loan: { name: string; emiAmount: number; nextEmiAmount?: number }) => ({
        category: "EMI",
        amount: mode === "yearly"
          ? (loan.nextEmiAmount ?? loan.emiAmount) * 12
          : (loan.nextEmiAmount ?? loan.emiAmount),
        note: loan.name,
      }));

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

  function resetForm() {
    setIncome(0);
    setIncomeHint("");
    setLineItems([{ category: "", amount: 0 }]);
    setPaidItems([]);
  }

  /* ── Save / Delete ── */

  async function handleSave() {
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

    if (savedPlan) {
      setShowOverwriteModal(true);
      return;
    }

    await doSave();
  }

  async function doSave() {
    setSubmitting(true);
    setShowOverwriteModal(false);

    const validItems = lineItems.filter((i) => i.category && i.amount > 0);
    const result = await saveBudgetPlan({
      monthAndYear,
      mode,
      income,
      lineItems: validItems.map((i) => ({
        category: i.category,
        amount: i.amount,
        ...(i.note ? { note: i.note } : {}),
      })),
      paidItems: paidItems
        .filter((i) => i.category && i.amount > 0)
        .map((i) => ({
          category: i.category,
          amount: i.amount,
          ...(i.note ? { note: i.note } : {}),
        })),
    });

    setSubmitting(false);

    if (result.success) {
      notify("Budget plan saved!", "success");
      await fetchData(monthAndYear, mode);
    } else {
      notify(result.error, "error");
    }
  }

  async function handleDelete() {
    if (!savedPlan) return;
    setSubmitting(true);
    setShowDeleteModal(false);

    const result = await deleteBudgetPlan(savedPlan.id);
    setSubmitting(false);

    if (result.success) {
      notify("Budget plan deleted", "success");
      setSavedPlan(null);
      resetForm();
      await fetchData(monthAndYear, mode);
    } else {
      notify(result.error, "error");
    }
  }

  /* ── Comparison helpers ── */

  function deltaPercent(prev: number, current: number): number {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / Math.abs(prev)) * 100;
  }

  function getCategoryDiffs(): Array<{
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

  const SUGGESTION_COLORS: Record<string, string> = {
    warning: "#f59e0b",
    info: "#3b82f6",
    success: "#22c55e",
    danger: "#ef4444",
  };

  /* ── Render ── */

  return (
    <>
      <FinanceHeader
        title="Budget Planner"
      />

      {notification && (
        <NotificationBanner $type={notification.type} $leaving={notifLeaving}>
          {notification.message}
        </NotificationBanner>
      )}

      <PageWrapper>
        {/* ── Mode Toggle ── */}
        <ModeToggle>
          <ModeButton
            $active={mode === "monthly"}
            onClick={() => {
              setMode("monthly");
              setMonthAndYear(getCurrentMonth());
            }}
          >
            Monthly
          </ModeButton>
          <ModeButton
            $active={mode === "yearly"}
            onClick={() => {
              setMode("yearly");
              setMonthAndYear(getCurrentYear());
            }}
          >
            Yearly
          </ModeButton>
        </ModeToggle>

        {/* ── Period Selector ── */}
        <MonthSelector>
          <MonthArrowButton onClick={() => setMonthAndYear(mode === "monthly" ? shiftMonth(monthAndYear, -1) : shiftYear(monthAndYear, -1))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M15 19l-7-7 7-7" />
            </svg>
          </MonthArrowButton>

          <MonthLabel>{mode === "monthly" ? formatMonthLabel(monthAndYear) : formatYearLabel(monthAndYear)}</MonthLabel>

          <MonthArrowButton onClick={() => setMonthAndYear(mode === "monthly" ? shiftMonth(monthAndYear, 1) : shiftYear(monthAndYear, 1))}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9 5l7 7-7 7" />
            </svg>
          </MonthArrowButton>

          {mode === "monthly" && (
            <MonthInput
              type="month"
              value={monthAndYear}
              onChange={(e) => setMonthAndYear(e.target.value)}
            />
          )}

          {savedPlan && <SavedBadge>Saved ✓</SavedBadge>}
        </MonthSelector>

        {loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : (
          <>
            {/* ── Section 1: Income ── */}
            <SectionCard>
              <SectionTitle>{mode === "monthly" ? "Last Credited Income" : "Annual Income"}</SectionTitle>
              <IncomeRow>
                <InputLabel htmlFor="income">₹</InputLabel>
                <FinanceInput
                  id="income"
                  type="number"
                  min={0}
                  placeholder={mode === "monthly" ? "Enter last credited income" : "Enter annual income"}
                  value={income || ""}
                  onChange={(e) => setIncome(Number(e.target.value))}
                />
              </IncomeRow>
              {incomeHint && <IncomeHint>{incomeHint}</IncomeHint>}
            </SectionCard>

            {/* ── Section 2: Summary ── */}
            {income > 0 && (
              <SectionCard>
                <SectionTitleRow>
                  <SectionTitle style={{ margin: 0 }}>Summary</SectionTitle>
                  {suggestions.length > 0 && (
                    <SuggestionsButton onClick={() => setShowSuggestionsModal(true)}>
                      💡 Smart Suggestions ({suggestions.length})
                    </SuggestionsButton>
                  )}
                </SectionTitleRow>
                <SummaryGrid>
                  <MetricCard>
                    <MetricLabel>{mode === "monthly" ? "Last Credited Income" : "Annual Income"}</MetricLabel>
                    <MetricValue>{formatCurrency(income)}</MetricValue>
                  </MetricCard>
                  <MetricCard>
                    <MetricLabel>Total Estimated Expenses</MetricLabel>
                    <MetricValue>{formatCurrency(totalExpenses)}</MetricValue>
                  </MetricCard>
                  <MetricCard>
                    <MetricLabel>Total Paid Expenses</MetricLabel>
                    <MetricValue $color="#22c55e">{formatCurrency(totalPaid)}</MetricValue>
                  </MetricCard>
                  <MetricCard>
                    <MetricLabel>Remaining Balance</MetricLabel>
                    <MetricValue
                      $color={remaining >= 0 ? "#22c55e" : "#ef4444"}
                    >
                      {formatCurrency(remaining)}
                    </MetricValue>
                  </MetricCard>
                  <MetricCard>
                    <MetricLabel>Savings Rate</MetricLabel>
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
            )}

            {/* ── Section 3: Estimated Expenses ── */}
            <SectionCard>
              <SectionTitle>Estimated Expenses</SectionTitle>
              <LineItemGrid>
                {lineItems.map((item, index) => (
                  <LineItemRow key={index}>
                    <LineItemField $flex={1.2}>
                      <FinanceSelect
                        value={item.category}
                        onChange={(e) =>
                          updateLineItem(index, "category", e.target.value)
                        }
                      >
                        <option value="">Select Category</option>
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </FinanceSelect>
                    </LineItemField>
                    <LineItemField>
                      <FinanceInput
                        type="number"
                        min={0}
                        placeholder="Amount"
                        value={item.amount || ""}
                        onChange={(e) =>
                          updateLineItem(index, "amount", Number(e.target.value))
                        }
                      />
                    </LineItemField>
                    <LineItemField>
                      <FinanceInput
                        type="text"
                        placeholder="Note (required)"
                        value={item.note || ""}
                        onChange={(e) =>
                          updateLineItem(index, "note", e.target.value)
                        }
                      />
                    </LineItemField>
                    <MarkPaidButton
                      onClick={() => markAsPaid(index)}
                      disabled={!item.category || !item.amount}
                      title="Mark as paid"
                    >
                      ✓
                    </MarkPaidButton>
                    <RemoveButton
                      onClick={() => removeLineItem(index)}
                      title="Remove"
                    >
                      ✕
                    </RemoveButton>
                  </LineItemRow>
                ))}
              </LineItemGrid>

              <ExpenseActions>
                <AddButton onClick={addLineItem}>+ Add Expense</AddButton>
                <AddButton onClick={importEMIs}>📥 Import existing loan EMIs</AddButton>
              </ExpenseActions>

              <TotalRow>
                <span>Total Estimated Expenses</span>
                <span>{formatCurrency(totalExpenses)}</span>
              </TotalRow>
            </SectionCard>

            {/* ── Section 4: Paid Expenses ── */}
            {paidItems.length > 0 && (
              <PaidSectionCard>
                <SectionTitle>Paid Expenses</SectionTitle>
                {paidItems.map((item, index) => (
                  <PaidItemRow key={index}>
                    <PaidItemInfo>
                      <PaidCategory>{item.category}</PaidCategory>
                      {item.note && <PaidNote>— {item.note}</PaidNote>}
                    </PaidItemInfo>
                    <PaidAmount>{formatCurrency(item.amount)}</PaidAmount>
                    <UndoButton onClick={() => undoPaid(index)}>↩ Undo</UndoButton>
                  </PaidItemRow>
                ))}
                <TotalRow>
                  <span>Total Paid Expenses</span>
                  <span style={{ color: "#22c55e" }}>{formatCurrency(totalPaid)}</span>
                </TotalRow>
              </PaidSectionCard>
            )}

            {/* ── Section 5: Previous Month Comparison ── */}
            <SectionCard>
              <SectionTitle>
                {mode === "monthly" ? "Last Month vs This Month" : "Last Year vs This Year"}
              </SectionTitle>
              {prevPlan && income > 0 && hasExpenseData ? (
                <>
                  <ComparisonGrid>
                    <ComparisonCard>
                      <ComparisonLabel>Income</ComparisonLabel>
                      <ComparisonValues>
                        <ComparisonFrom>
                          {formatCurrency(prevPlan.income)}
                        </ComparisonFrom>
                        <ComparisonArrow>→</ComparisonArrow>
                        <ComparisonTo>{formatCurrency(income)}</ComparisonTo>
                      </ComparisonValues>
                      <DeltaIndicator
                        $positive={income >= prevPlan.income}
                      >
                        {income >= prevPlan.income ? "↑" : "↓"}{" "}
                        {Math.abs(deltaPercent(prevPlan.income, income)).toFixed(1)}%
                      </DeltaIndicator>
                    </ComparisonCard>

                    <ComparisonCard>
                      <ComparisonLabel>Expenses</ComparisonLabel>
                      <ComparisonValues>
                        <ComparisonFrom>
                          {formatCurrency(prevTotalExpenses)}
                        </ComparisonFrom>
                        <ComparisonArrow>→</ComparisonArrow>
                        <ComparisonTo>
                          {formatCurrency(totalExpenses)}
                        </ComparisonTo>
                      </ComparisonValues>
                      <DeltaIndicator
                        $positive={totalExpenses <= prevTotalExpenses}
                      >
                        {totalExpenses <= prevTotalExpenses ? "↓" : "↑"}{" "}
                        {Math.abs(
                          deltaPercent(prevTotalExpenses, totalExpenses)
                        ).toFixed(1)}
                        %
                      </DeltaIndicator>
                    </ComparisonCard>

                    <ComparisonCard>
                      <ComparisonLabel>Savings</ComparisonLabel>
                      <ComparisonValues>
                        <ComparisonFrom>
                          {formatCurrency(prevRemaining)}
                        </ComparisonFrom>
                        <ComparisonArrow>→</ComparisonArrow>
                        <ComparisonTo>
                          {formatCurrency(remaining)}
                        </ComparisonTo>
                      </ComparisonValues>
                      <DeltaIndicator
                        $positive={remaining >= prevRemaining}
                      >
                        {remaining >= prevRemaining ? "↑" : "↓"}{" "}
                        {Math.abs(
                          deltaPercent(prevRemaining, remaining)
                        ).toFixed(1)}
                        %
                      </DeltaIndicator>
                    </ComparisonCard>

                    <ComparisonCard>
                      <ComparisonLabel>Savings Rate</ComparisonLabel>
                      <ComparisonValues>
                        <ComparisonFrom>
                          {prevSavingsRate.toFixed(1)}%
                        </ComparisonFrom>
                        <ComparisonArrow>→</ComparisonArrow>
                        <ComparisonTo>
                          {savingsRate.toFixed(1)}%
                        </ComparisonTo>
                      </ComparisonValues>
                      <DeltaIndicator
                        $positive={savingsRate >= prevSavingsRate}
                      >
                        {savingsRate >= prevSavingsRate ? "↑" : "↓"}{" "}
                        {Math.abs(savingsRate - prevSavingsRate).toFixed(1)}pp
                      </DeltaIndicator>
                    </ComparisonCard>
                  </ComparisonGrid>

                  {getCategoryDiffs().length > 0 && (
                    <>
                      <SectionTitle style={{ fontSize: 14, marginTop: 8 }}>
                        Category Breakdown
                      </SectionTitle>
                      <CategoryDiffGrid>
                        {getCategoryDiffs().map((d) => (
                          <CategoryDiffItem
                            key={d.category}
                            $flagged={d.flagged}
                          >
                            <span>{d.category}</span>
                            <DeltaIndicator $positive={d.delta <= 0}>
                              {d.delta <= 0 ? "↓" : "↑"}{" "}
                              {Math.abs(d.delta).toFixed(0)}%
                              {d.flagged && " ⚠"}
                            </DeltaIndicator>
                          </CategoryDiffItem>
                        ))}
                      </CategoryDiffGrid>
                      {totalExpenses < prevTotalExpenses && (
                        <MutedText style={{ color: "#22c55e", fontWeight: 600 }}>
                          ✅ Total expenses decreased compared to last month!
                        </MutedText>
                      )}
                    </>
                  )}
                </>
              ) : (
                <MutedText>
                  No plan saved for {mode === "monthly" ? formatMonthLabel(shiftMonth(monthAndYear, -1)) : shiftYear(monthAndYear, -1)}
                  . Save plans {mode === "monthly" ? "monthly" : "yearly"} to track trends.
                </MutedText>
              )}
            </SectionCard>

            {/* ── Action Buttons ── */}
            <ActionBar>
              <PrimaryButton
                onClick={handleSave}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Save Plan"}
              </PrimaryButton>
              <OutlineButton onClick={resetForm}>Reset</OutlineButton>
              {savedPlan && (
                <DangerButton
                  onClick={() => setShowDeleteModal(true)}
                  disabled={submitting}
                >
                  Delete Plan
                </DangerButton>
              )}
            </ActionBar>
          </>
        )}
      </PageWrapper>

      {/* ── Overwrite Confirmation Modal ── */}
      <Modal
        isOpen={showOverwriteModal}
        onClose={() => setShowOverwriteModal(false)}
        title="Overwrite Existing Plan?"
      >
        <ConfirmBody>
          <OverwriteWarning>
            A budget plan already exists for {mode === "monthly" ? formatMonthLabel(monthAndYear) : monthAndYear}.
            Saving will overwrite it. Continue?
          </OverwriteWarning>
          <ConfirmActions>
            <ConfirmButton
              $variant="cancel"
              onClick={() => setShowOverwriteModal(false)}
            >
              Cancel
            </ConfirmButton>
            <ConfirmButton
              $variant="primary"
              onClick={doSave}
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Overwrite"}
            </ConfirmButton>
          </ConfirmActions>
        </ConfirmBody>
      </Modal>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Budget Plan?"
      >
        <ConfirmBody>
          <ConfirmText>
            This will permanently delete your budget plan for{" "}
            {mode === "monthly" ? formatMonthLabel(monthAndYear) : monthAndYear}. This action cannot be undone.
          </ConfirmText>
          <ConfirmActions>
            <ConfirmButton
              $variant="cancel"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancel
            </ConfirmButton>
            <ConfirmButton
              $variant="danger"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Deleting…" : "Delete"}
            </ConfirmButton>
          </ConfirmActions>
        </ConfirmBody>
      </Modal>

      {/* ── Smart Suggestions Modal ── */}
      <Modal
        isOpen={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        title="Smart Suggestions"
        size="md"
      >
        {suggestions.map((s, i) => (
          <SuggestionCard
            key={i}
            $accentColor={SUGGESTION_COLORS[s.type] || "#3b82f6"}
          >
            <SuggestionIcon>{s.icon}</SuggestionIcon>
            <SuggestionText>{s.text}</SuggestionText>
          </SuggestionCard>
        ))}
      </Modal>
    </>
  );
}
