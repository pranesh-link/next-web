"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import {
  getLoans,
  createLoan,
  updateLoan,
  deleteLoan,
  simulateLoanPrepayment,
  getLoanInsightsAction,
  getLoanSchedule,
  addPrepayment,
  removePrepayment,
} from "@/couple/finance/_actions/loans";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import LoanForm from "@/couple/_components/forms/LoanForm";
import LoanScheduleScanner from "@/couple/_components/loan/LoanScheduleScanner";
import type { ScannedLoanData } from "@/couple/_components/loan/LoanScheduleScanner";
import Modal from "@/couple/_components/shared/Modal";
import EmptyState from "@/couple/_components/shared/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

/* ── Types ──────────────────────────────────────────── */

type Loan = {
  id: string;
  name: string;
  loanProvider?: string | null;
  loanAccountNumber?: string | null;
  scheduleGeneratedOn?: string | null;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  startDate: string | Date;
  remainingBalance: number;
  prepayments?: { date: string; amount: number; balanceAfter?: number; source?: "scanned" | "manual" }[] | null;
  schedule?: ScheduleEntry[] | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type PrepaymentResult = {
  originalInterest: number;
  newInterest: number;
  interestSaved: number;
  newTenure: number;
  originalTenure: number;
};

type ClosureScenario = {
  extraMonthlyAmount: number;
  newTotalEMI: number;
  monthsToClose: number;
  monthsSaved: number;
  closureDate: string;
  interestSaved: number;
};

type InsightResult = {
  totalInterestPayable: number;
  monthsRemaining: number;
  earlyPayoffSavings?: number;
  prepaymentAmount?: number;
  scenarios?: ClosureScenario[];
};

type ScheduleEntry = {
  month: number;
  date: string;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
};

type Notification = {
  message: string;
  type: "success" | "error";
};

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

/* ── Helpers ────────────────────────────────────────── */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

const fillExpand = keyframes`
  from { width: 0%; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Styled Components ──────────────────────────────── */

const PageWrapper = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

/* ── Summary Cards ── */

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCardStyled = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ${EASING};

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
  }
`;

const SummaryLabel = styled.p`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
`;

const SummaryValue = styled.p<{ $color?: string }>`
  font-size: 24px;
  font-weight: 800;
  color: ${(p) => p.$color ?? "var(--text)"};
  margin: 0;
  letter-spacing: -1px;
`;

/* ── Loan Cards Grid ── */

const LoanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LoanCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transition: all 0.3s ${EASING};

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
  }
`;

const LoanCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const LoanName = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: "";
    display: block;
    width: 4px;
    height: 20px;
    border-radius: 2px;
    background: var(--accent);
    flex-shrink: 0;
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 2px;
`;

const IconButton = styled.button<{ $variant?: "edit" | "delete" }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface-hover);
    color: ${(p) =>
      p.$variant === "delete" ? "var(--danger)" : "var(--accent)"};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

/* ── Details Grid ── */

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
`;

const DetailItem = styled.div``;

const DetailLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin: 0 0 4px 0;
`;

const DetailValue = styled.p<{ $color?: string }>`
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => p.$color ?? "var(--text)"};
  margin: 0;
`;

const EmiTooltip = styled.span`
  margin-left: 6px;
  cursor: pointer;
  font-size: 14px;
  position: relative;
  display: inline-block;
`;

const EmiTooltipBubble = styled.span`
  position: absolute;
  top: 50%;
  left: calc(100% + 8px);
  transform: translateY(-50%);
  width: 220px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--bg-elevated, #1e1e2e);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 10;
  pointer-events: auto;
  white-space: normal;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: var(--border);
  }
`;

/* ── Progress Bar ── */

const ProgressSection = styled.div`
  margin-bottom: 16px;
`;

const ProgressMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const ProgressLabel = styled.span`
  font-size: 12px;
  color: var(--text-dim);
`;

const ProgressPct = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: var(--surface-hover);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $width: number }>`
  height: 100%;
  border-radius: 6px;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: linear-gradient(90deg, var(--accent), #22d3ee);
  transition: width 1s ${EASING};
  animation: ${fillExpand} 0.8s ${EASING};
`;

/* ── Remaining & Date ── */

const RemainingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
`;

const RemainingLabel = styled.span`
  font-size: 12px;
  color: var(--text-dim);
`;

const RemainingValue = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: var(--warning);
`;

const StartDate = styled.p`
  font-size: 12px;
  color: var(--text-dim);
  margin: 0 0 4px 0;
`;

const ScheduleSourceNote = styled.p`
  font-size: 11px;
  color: var(--text);
  font-style: italic;
  margin: 0 0 16px 0;
  padding: 5px 8px;
  background: rgba(59, 130, 246, 0.1);
  border-left: 2px solid rgba(59, 130, 246, 0.4);
  border-radius: 0 4px 4px 0;
`;

const AccountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-light);
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.18);
  border-radius: 5px;
  padding: 2px 7px;
  letter-spacing: 0.3px;
`;

const LoanMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  margin-top: -10px;
`;

const LoanProviderText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.2px;
`;

const ScenarioTable = styled.div`
  margin-top: 12px;
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 8px;
  overflow: hidden;
`;

const ScenarioRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 7px 10px;
  font-size: 12px;
  border-bottom: 1px solid rgba(245, 158, 11, 0.08);
  min-width: 0;

  &:last-child { border-bottom: none; }
  &:first-child {
    background: rgba(245, 158, 11, 0.06);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--warning);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }
`;

const ScenarioCell = styled.span<{ $color?: string }>`
  color: ${(p) => p.$color ?? "var(--text-dim)"};
  font-variant-numeric: tabular-nums;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardMetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
  gap: 12px;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MetaLabel = styled.span`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
`;

const MetaValue = styled.span<{ $urgent?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => (p.$urgent ? "#ef4444" : "var(--text)")};
`;

/* ── Action Buttons Row ── */

const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const SmallButton = styled.button<{
  $variant?: "primary" | "outline" | "accent" | "orange" | "green";
}>`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  background: ${(p) =>
    p.$variant === "primary"
      ? "var(--accent)"
      : p.$variant === "accent"
        ? "rgba(59, 130, 246, 0.1)"
        : p.$variant === "orange"
          ? "rgba(234, 130, 50, 0.15)"
          : p.$variant === "green"
            ? "rgba(34, 197, 94, 0.12)"
            : "transparent"};
  color: ${(p) =>
    p.$variant === "primary"
      ? "#fff"
      : p.$variant === "accent"
        ? "var(--accent-light)"
        : p.$variant === "orange"
          ? "rgb(194, 100, 20)"
          : p.$variant === "green"
            ? "rgb(22, 163, 74)"
            : "var(--text-dim)"};
  border-color: ${(p) =>
    p.$variant === "primary"
      ? "var(--accent)"
      : p.$variant === "accent"
        ? "rgba(59, 130, 246, 0.3)"
        : p.$variant === "orange"
          ? "rgba(234, 130, 50, 0.4)"
          : p.$variant === "green"
            ? "rgba(34, 197, 94, 0.35)"
            : "var(--border)"};

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

/* ── Prepayment Simulator ── */

const SimulatorWrapper = styled.div`
  margin-top: 16px;
  padding: 20px;
  background: rgba(59, 130, 246, 0.04);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

const SimulatorTitle = styled.h4`
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-light);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SimInputRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
`;

const DarkInput = styled.input`
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ${EASING};

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: stretch;
`;

const ComparisonColumn = styled.div<{ $side: "before" | "after" }>`
  padding: 16px;
  border-radius: ${(p) =>
    p.$side === "before" ? "10px 0 0 10px" : "0 10px 10px 0"};
  background: ${(p) =>
    p.$side === "before"
      ? "rgba(255, 255, 255, 0.03)"
      : "rgba(34, 197, 94, 0.05)"};
  border: 1px solid
    ${(p) =>
      p.$side === "before"
        ? "var(--border)"
        : "rgba(34, 197, 94, 0.2)"};
`;

const ComparisonDivider = styled.div`
  width: 1px;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::after {
    content: "→";
    position: absolute;
    background: var(--surface);
    color: var(--text-muted);
    font-size: 12px;
    padding: 4px;
    border-radius: 4px;
  }
`;

const CompColTitle = styled.p`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin: 0 0 12px 0;
`;

const CompItem = styled.div`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CompItemLabel = styled.p`
  font-size: 11px;
  color: var(--text-muted);
  margin: 0 0 2px 0;
`;

const CompItemValue = styled.p<{ $color?: string }>`
  font-size: 15px;
  font-weight: 700;
  color: ${(p) => p.$color ?? "var(--text)"};
  margin: 0;
`;

const SavedBanner = styled.div`
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SavedLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--success);
`;

const SavedValue = styled.span`
  font-size: 18px;
  font-weight: 800;
  color: var(--success);
`;

/* ── Insights Panel ── */

const InsightsPanel = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: rgba(245, 158, 11, 0.04);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 12px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

const InsightsTitle = styled.h4`
  font-size: 13px;
  font-weight: 700;
  color: var(--warning);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InsightRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;

  & + & {
    border-top: 1px solid rgba(245, 158, 11, 0.1);
  }
`;

const InsightLabel = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

const InsightValue = styled.span<{ $color?: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.$color ?? "var(--text)"};
`;

/* ── Repayment Schedule ── */

const SchedulePanel = styled.div`
  margin-top: 16px;
  padding: 20px;
  background: rgba(59, 130, 246, 0.04);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

const ScheduleTableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 0 4px;
`;

const ScheduleTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 480px;
`;

const ScheduleTh = styled.th<{ $align?: string }>`
  text-align: ${(p) => p.$align ?? "left"};
  padding: 8px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
`;

const ScheduleTd = styled.td<{ $align?: string; $color?: string }>`
  text-align: ${(p) => p.$align ?? "left"};
  padding: 7px 10px;
  color: ${(p) => p.$color ?? "var(--text-dim)"};
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;

/* ── Accordion ── */

const AccordionSection = styled.div`
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;

  & + & {
    margin-top: 12px;
  }
`;

const AccordionHeader = styled.button<{ $open: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${(p) => (p.$open ? "rgba(59, 130, 246, 0.06)" : "var(--surface)")};
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ${EASING};

  &:hover {
    background: rgba(59, 130, 246, 0.08);
  }
`;

const AccordionTitle = styled.span<{ $color?: string }>`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(p) => p.$color ?? "var(--text)"};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AccordionBadge = styled.span<{ $color?: string }>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${(p) => p.$color ?? "rgba(59, 130, 246, 0.15)"};
  color: ${(p) => p.$color === "rgba(34, 197, 94, 0.15)" ? "var(--success)" : "var(--accent-light)"};
`;

const AccordionChevron = styled.span<{ $open: boolean }>`
  font-size: 12px;
  color: var(--text-muted);
  transition: transform 0.2s ${EASING};
  transform: rotate(${(p) => (p.$open ? "180deg" : "0deg")});
`;

const AccordionBody = styled.div<{ $open: boolean }>`
  display: ${(p) => (p.$open ? "block" : "none")};
`;

/* ── Import Bar ── */

const ImportBar = styled.div`
  margin-bottom: 16px;
`;

const ImportButton = styled.button`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: var(--accent-light);
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: var(--accent);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
    transform: translateY(-1px);
  }
`;

/* ── Delete Confirm ── */

const ConfirmBody = styled.div`
  text-align: center;
`;

const ConfirmText = styled.p`
  font-size: 14px;
  color: var(--text-dim);
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

const ConfirmButton = styled.button<{ $variant: "danger" | "cancel" }>`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  background: ${(p) =>
    p.$variant === "danger" ? "var(--danger)" : "var(--surface)"};
  color: ${(p) => (p.$variant === "danger" ? "#fff" : "var(--text)")};
  border: 1px solid
    ${(p) => (p.$variant === "danger" ? "var(--danger)" : "var(--border)")};

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
    p.$type === "success" ? "var(--success)" : "var(--danger)"};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
  pointer-events: none;
`;

const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px 24px;
  color: var(--danger);
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
`;

/* ── Component ──────────────────────────────────────── */

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Loan | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  /* Prepayment Simulator State */
  const [simulatorLoanId, setSimulatorLoanId] = useState<string | null>(null);
  const [prepaymentAmount, setPrepaymentAmount] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<PrepaymentResult | null>(null);

  /* Insights State */
  const [insightsLoanId, setInsightsLoanId] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsData, setInsightsData] = useState<InsightResult | null>(null);

  /* Schedule State */
  const [scheduleLoanId, setScheduleLoanId] = useState<string | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[] | null>(null);
  const [schedulePendingOpen, setSchedulePendingOpen] = useState(true);
  const [schedulePaidOpen, setSchedulePaidOpen] = useState(false);

  /* PDF Scanner State */
  const [showScanModal, setShowScanModal] = useState(false);
  const [isScanningSchedule, setIsScanningSchedule] = useState(false);
  const [scannedLoan, setScannedLoan] = useState<Partial<Loan> | null>(null);
  const [scannedLoanAccountNumber, setScannedLoanAccountNumber] = useState<string | null>(null);
  const [scannedLoanProvider, setScannedLoanProvider] = useState<string | null>(null);
  const [scannedScheduleGeneratedOn, setScannedScheduleGeneratedOn] = useState<string | null>(null);
  const [scannedPrepayments, setScannedPrepayments] = useState<
    { date: string; amount: number; balanceAfter?: number; source?: "scanned" | "manual" }[] | null
  >(null);
  const [scannedSchedule, setScannedSchedule] = useState<
    { month: number; date: string; emi: number; principal: number; interest: number; balance: number }[] | null
  >(null);

  /* Phase 2 — background schedule extraction state */
  const [pendingScheduleParams, setPendingScheduleParams] = useState<{
    rawScheduleText: string;
  } | null>(null);
  const [pendingSchedule, setPendingSchedule] = useState<{
    loanId: string;
    rawScheduleText: string;
  } | null>(null);
  const [scheduleLoadingLoanId, setScheduleLoadingLoanId] = useState<string | null>(null);
  const [scheduleLoadErrors, setScheduleLoadErrors] = useState<Record<string, string>>({});
  const [scheduleCache, setScheduleCache] = useState<Record<string, ScheduleEntry[]>>({});

  /* Prepayments Modal State */
  const [prepaymentModalLoanId, setPrepaymentModalLoanId] = useState<string | null>(null);
  const [ppDate, setPpDate] = useState("");
  const [ppAmount, setPpAmount] = useState("");
  const [ppSubmitting, setPpSubmitting] = useState(false);

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

  /* Varying-EMI tooltip */
  const [varyingEmiTipId, setVaryingEmiTipId] = useState<string | null>(null);
  useEffect(() => {
    if (!varyingEmiTipId) return;
    const close = () => setVaryingEmiTipId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [varyingEmiTipId]);

  /* ── Data fetching ── */

  const fetchLoans = useCallback(async () => {
    const result = await getLoans();
    if (result.success) {
      const loansData = result.data as unknown as Loan[];
      setLoans(loansData);
      setError(null);
      // Pre-populate schedule cache for loans that already have DB-stored rows
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

  /* ── Summary computation ── */

  const totalLoans = loans.length;
  const totalOutstanding = loans.reduce((s, l) => s + l.remainingBalance, 0);
  const monthlyEmiLoad = loans.reduce((s, l) => {
    // Use next EMI from schedule if available, otherwise fall back to emiAmount
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

  /* ── Handlers ── */

  function handleOpenAdd() {
    setEditTarget(null);
    setScannedLoan(null);
    setShowModal(true);
  }

  function handleScanComplete(data: ScannedLoanData) {
    setShowScanModal(false);
    setScannedPrepayments(
      data.prepayments && data.prepayments.length > 0
        ? data.prepayments.map((pp) => ({ ...pp, source: "scanned" as const }))
        : null,
    );
    setScannedSchedule(
      data.schedule && data.schedule.length > 0 ? data.schedule : null,
    );
    setScannedLoanAccountNumber(data.loanAccountNumber ?? null);
    setScannedLoanProvider(data.loanProvider ?? null);
    setScannedScheduleGeneratedOn(data.scheduleGeneratedOn ?? null);

    const rawText = data.rawScheduleText ?? "";
    if (rawText) {
      setPendingScheduleParams({ rawScheduleText: rawText });
    } else {
      setPendingScheduleParams(null);
    }

    setScannedLoan({
      name: data.loanName ?? "",
      loanProvider: data.loanProvider ?? null,
      loanAccountNumber: data.loanAccountNumber ?? null,
      scheduleGeneratedOn: data.scheduleGeneratedOn ?? null,
      principal: data.principal ?? 0,
      interestRate: data.interestRate ?? 0,
      tenureMonths: data.tenureMonths ?? 0,
      emiAmount: data.emiAmount ?? 0,
      startDate: data.startDate ?? new Date().toISOString().split("T")[0],
      remainingBalance: data.remainingBalance || data.principal || 0,
    });
    setEditTarget(null);
    setShowModal(true);
  }

  function handleEdit(loan: Loan) {
    setEditTarget(loan);
    setShowModal(true);
  }

  function handleDeletePrompt(id: string) {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setSubmitting(true);
    const result = await deleteLoan(deleteTargetId);
    setSubmitting(false);
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);

    if (result.success) {
      notify("Loan deleted", "success");
      await fetchLoans();
    } else {
      notify(result.error, "error");
    }
  }

  async function handleFormSubmit(data: {
    name: string;
    loanProvider?: string;
    loanAccountNumber?: string;
    principalAmount: number;
    interestRate: number;
    tenureMonths: number;
    emiAmount: number;
    startDate: string;
    remainingBalance: number;
  }) {
    setSubmitting(true);

    const payload = {
      name: data.name,
      // Prefer the scanned value; fall back to whatever was in the form
      ...(scannedLoanProvider
        ? { loanProvider: scannedLoanProvider }
        : data.loanProvider
          ? { loanProvider: data.loanProvider }
          : {}),
      ...(scannedLoanAccountNumber
        ? { loanAccountNumber: scannedLoanAccountNumber }
        : data.loanAccountNumber
          ? { loanAccountNumber: data.loanAccountNumber }
          : {}),
      principal: data.principalAmount,
      interestRate: data.interestRate,
      tenureMonths: data.tenureMonths,
      emiAmount: data.emiAmount,
      startDate: data.startDate,
      remainingBalance: data.remainingBalance,
      ...(scannedScheduleGeneratedOn ? { scheduleGeneratedOn: scannedScheduleGeneratedOn } : {}),
      ...(scannedPrepayments ? { prepayments: scannedPrepayments } : {}),
      ...(scannedSchedule ? { schedule: scannedSchedule } : {}),
    };

    const result = editTarget
      ? await updateLoan(editTarget.id, payload)
      : await createLoan(payload);

    setSubmitting(false);
    setScannedPrepayments(null);
    setScannedSchedule(null);
    setScannedLoanAccountNumber(null);
    setScannedLoanProvider(null);
    setScannedScheduleGeneratedOn(null);

    if (result.success) {
      notify(editTarget ? "Loan updated" : "Loan added", "success");
      setShowModal(false);
      setEditTarget(null);

      // Phase 2: if raw schedule text is available, skip the first fetchLoans here —
      // loadFullSchedule will call fetchLoans after saving the schedule (single fetch, no duplicate).
      if (pendingScheduleParams?.rawScheduleText && result.data?.id) {
        const { rawScheduleText } = pendingScheduleParams;
        const loanId = result.data.id as string;
        setPendingScheduleParams(null);
        setPendingSchedule({ loanId, rawScheduleText });
        loadFullSchedule(loanId, rawScheduleText);
      } else {
        // No schedule extraction — fetch immediately to refresh list
        await fetchLoans();
      }
    } else {
      notify(result.error, "error");
    }
  }

  async function loadFullSchedule(loanId: string, rawScheduleText: string) {
    setScheduleLoadingLoanId(loanId);
    setScheduleLoadErrors((prev) => { const n = { ...prev }; delete n[loanId]; return n; });

    try {
      const res = await fetch("/api/finance/update-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId, rawScheduleText }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setScheduleLoadErrors((prev) => ({
          ...prev,
          [loanId]: data.error || "Schedule extraction failed",
        }));
      } else {
        setPendingSchedule(null);
        await fetchLoans();
      }
    } catch {
      setScheduleLoadErrors((prev) => ({
        ...prev,
        [loanId]: "Network error \u2014 tap Retry to try again",
      }));
    } finally {
      setScheduleLoadingLoanId(null);
    }
  }

  /* ── Prepayment Simulator ── */

  function toggleSimulator(loanId: string) {
    if (simulatorLoanId === loanId) {
      setSimulatorLoanId(null);
      setSimResult(null);
      setPrepaymentAmount("");
    } else {
      setSimulatorLoanId(loanId);
      setSimResult(null);
      setPrepaymentAmount("");
      // close other panels for this loan
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

  /* ── Insights ── */

  async function toggleInsights(loanId: string) {
    if (insightsLoanId === loanId) {
      setInsightsLoanId(null);
      setInsightsData(null);
      return;
    }
    // close other panels for this loan
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

  /* ── Repayment Schedule ── */

  async function toggleSchedule(loanId: string) {
    // close other panels for this loan before opening the schedule modal
    if (simulatorLoanId === loanId) { setSimulatorLoanId(null); setSimResult(null); setPrepaymentAmount(""); }
    if (insightsLoanId === loanId) { setInsightsLoanId(null); setInsightsData(null); }
    setScheduleLoanId(loanId);
    setSchedulePendingOpen(true);
    setSchedulePaidOpen(false);

    // Use cache if available — no server call needed
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
      // Cache for subsequent opens
      setScheduleCache((prev) => ({ ...prev, [loanId]: rows }));
    } else {
      notify(result.error, "error");
      setScheduleLoanId(null);
    }
  }

  /* ── Add / Remove Prepayment ── */

  async function handleAddPrepayment() {
    if (!prepaymentModalLoanId || !ppDate || !ppAmount) return;
    const amount = parseFloat(ppAmount);
    if (isNaN(amount) || amount <= 0) return;

    setPpSubmitting(true);
    const result = await addPrepayment(prepaymentModalLoanId, {
      date: ppDate,
      amount,
    });
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

  /* ── Render ── */

  return (
    <>
      {notification && (
        <NotificationBanner $type={notification.type} $leaving={notifLeaving}>
          {notification.message}
        </NotificationBanner>
      )}

      <FinanceHeader
        title="Loans & EMIs"
        action={{ label: "Add Loan", onClick: handleOpenAdd }}
        onRefresh={fetchLoans}
      />

      <PageWrapper>
        {/* Import from PDF */}
        <ImportBar>
          <ImportButton type="button" onClick={() => setShowScanModal(true)}>
            📄 Import from PDF
          </ImportButton>
        </ImportBar>
        {loading ? (
          <LoadingSkeleton type="card" count={3} />
        ) : error ? (
          <ErrorBanner>{error}</ErrorBanner>
        ) : loans.length === 0 ? (
          <EmptyState
            title="No loans yet"
            description="Add your first loan to track EMIs, simulate prepayments, and plan for early payoff."
            action={{ label: "Add Loan", onClick: handleOpenAdd }}
          />
        ) : (
          <>
            {/* Summary Row */}
            <SummaryRow>
              <SummaryCardStyled>
                <SummaryLabel>Total Loans</SummaryLabel>
                <SummaryValue>{totalLoans}</SummaryValue>
              </SummaryCardStyled>
              <SummaryCardStyled>
                <SummaryLabel>Total Outstanding</SummaryLabel>
                <SummaryValue $color="var(--warning)">
                  {formatCurrency(totalOutstanding)}
                </SummaryValue>
              </SummaryCardStyled>
              <SummaryCardStyled>
                <SummaryLabel>Monthly EMI Load</SummaryLabel>
                <SummaryValue $color="var(--danger)">
                  {formatCurrency(monthlyEmiLoad)}
                </SummaryValue>
              </SummaryCardStyled>
            </SummaryRow>

            {/* Loan Cards */}
            <LoanGrid>
              {loans.map((loan) => {
                // Calculate months elapsed and EMIs paid
                const start = new Date(loan.startDate);
                const now = new Date();
                const monthsElapsed = Math.max(
                  0,
                  (now.getFullYear() - start.getFullYear()) * 12 +
                    (now.getMonth() - start.getMonth()),
                );
                // First EMI is paid in the start month itself; if this month's
                // EMI date has passed, count the current month too
                const emiDayPassed = now.getDate() >= start.getDate();
                const emisPaid = Math.min(
                  monthsElapsed + (emiDayPassed ? 1 : 0),
                  loan.tenureMonths,
                );

                const repaidPct =
                  loan.principal > 0
                    ? Math.round(
                        ((loan.principal - loan.remainingBalance) /
                          loan.principal) *
                          100,
                      )
                    : 0;

                // Next EMI date
                const nextEmiOffset = emiDayPassed ? monthsElapsed + 1 : monthsElapsed;
                const nextEmi = new Date(start);
                nextEmi.setMonth(nextEmi.getMonth() + nextEmiOffset);
                const daysUntilNextEmi = Math.ceil(
                  (nextEmi.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
                );
                const isUrgent = daysUntilNextEmi <= 7 && daysUntilNextEmi >= 0;
                const loanCompleted = emisPaid >= loan.tenureMonths;

                // End date
                const endDate = new Date(start);
                endDate.setMonth(endDate.getMonth() + loan.tenureMonths - 1);
                const endDateStr = endDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });

                return (
                  <LoanCard key={loan.id}>
                    {/* Header */}
                    <LoanCardHeader>
                      <LoanName>
                        {loan.name}
                      </LoanName>
                      <CardActions>
                        <IconButton
                          $variant="edit"
                          onClick={() => handleEdit(loan)}
                          aria-label="Edit loan"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </IconButton>
                        <IconButton
                          $variant="delete"
                          onClick={() => handleDeletePrompt(loan.id)}
                          aria-label="Delete loan"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </IconButton>
                      </CardActions>
                    </LoanCardHeader>

                    {/* Account & Provider Meta */}
                    {(loan.loanAccountNumber || loan.loanProvider) && (
                      <LoanMeta>
                        {loan.loanAccountNumber && (
                          <AccountBadge title="Loan Account Number">
                            🔖 {loan.loanAccountNumber}
                          </AccountBadge>
                        )}
                        {loan.loanProvider && (
                          <LoanProviderText>{loan.loanProvider}</LoanProviderText>
                        )}
                      </LoanMeta>
                    )}

                    {/* Details Grid */}
                    <DetailsGrid>
                      <DetailItem>
                        <DetailLabel>Principal</DetailLabel>
                        <DetailValue>
                          {formatCurrency(loan.principal)}
                        </DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Interest Rate</DetailLabel>
                        <DetailValue>{loan.interestRate}%</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Tenure</DetailLabel>
                        <DetailValue>
                          {loan.tenureMonths} months
                        </DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>Ends</DetailLabel>
                        <DetailValue>{endDateStr}</DetailValue>
                      </DetailItem>
                      <DetailItem>
                        <DetailLabel>
                          {(() => {
                            const schedule = loan.schedule;
                            if (!schedule || schedule.length < 2) return "EMI";
                            const rows = schedule.length > 2 ? schedule.slice(0, -1) : schedule;
                            const firstEmi = rows[0].emi;
                            const isVarying = rows.some((r) => Math.abs(r.emi - firstEmi) > 1);
                            return isVarying ? "Next EMI" : "EMI";
                          })()}
                        </DetailLabel>
                        <DetailValue $color="var(--accent-light)">
                          {(() => {
                            const schedule = loan.schedule;
                            if (!schedule || schedule.length === 0) return formatCurrency(loan.emiAmount);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const nextEntry = schedule.find((e) => {
                              const d = new Date(e.date);
                              d.setHours(0, 0, 0, 0);
                              return d.getTime() >= today.getTime();
                            });
                            return formatCurrency(nextEntry ? nextEntry.emi : loan.emiAmount);
                          })()}
                          {(() => {
                            const schedule = loan.schedule;
                            if (!schedule || schedule.length < 2) return null;
                            const rows = schedule.length > 2 ? schedule.slice(0, -1) : schedule;
                            const firstEmi = rows[0].emi;
                            const isVarying = rows.some((r) => Math.abs(r.emi - firstEmi) > 1);
                            if (!isVarying) return null;
                            return (
                              <EmiTooltip
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVaryingEmiTipId((prev) => prev === loan.id ? null : loan.id);
                                }}
                              >
                                ℹ️
                                {varyingEmiTipId === loan.id && (
                                  <EmiTooltipBubble>
                                    This loan has varying EMIs. The amount shown is your next scheduled payment.
                                  </EmiTooltipBubble>
                                )}
                              </EmiTooltip>
                            );
                          })()}
                        </DetailValue>
                      </DetailItem>
                    </DetailsGrid>

                    {/* Schedule + Prepayments modal buttons — below EMI field */}
                    <ButtonRow style={{ marginBottom: "10px" }}>
                      {scheduleLoadingLoanId === loan.id ? (
                        <SmallButton $variant="orange" disabled>
                          Loading schedule…
                        </SmallButton>
                      ) : scheduleLoadErrors[loan.id] ? (
                        <>
                          <SmallButton
                            $variant="orange"
                            onClick={() => {
                              if (pendingSchedule?.loanId === loan.id) {
                                loadFullSchedule(loan.id, pendingSchedule.rawScheduleText);
                              }
                            }}
                          >
                            ↺ Retry Schedule
                          </SmallButton>
                          <SmallButton
                            $variant="orange"
                            onClick={() => toggleSchedule(loan.id)}
                          >
                            EMI Schedule
                          </SmallButton>
                        </>
                      ) : (
                        <SmallButton
                          $variant="orange"
                          onClick={() => toggleSchedule(loan.id)}
                        >
                          EMI Schedule
                        </SmallButton>
                      )}
                      <SmallButton
                        $variant="green"
                        onClick={() => setPrepaymentModalLoanId(loan.id)}
                      >
                        Prepayments{loan.prepayments && Array.isArray(loan.prepayments) && loan.prepayments.length > 0 ? ` (${loan.prepayments.length})` : ""}
                      </SmallButton>
                    </ButtonRow>

                    {/* Progress Bar */}
                    <ProgressSection>
                      <ProgressMeta>
                        <ProgressLabel>Repaid</ProgressLabel>
                        <ProgressPct>{repaidPct}%</ProgressPct>
                      </ProgressMeta>
                      <ProgressTrack>
                        <ProgressFill $width={repaidPct} />
                      </ProgressTrack>
                    </ProgressSection>

                    {/* Principal Outstanding */}
                    <RemainingRow>
                      <RemainingLabel>Principal Outstanding</RemainingLabel>
                      <RemainingValue>
                        {formatCurrency(loan.remainingBalance)}
                      </RemainingValue>
                    </RemainingRow>

                    {/* EMI Meta: Next EMI Date + EMIs Remaining */}
                    <CardMetaRow>
                      <MetaItem>
                        <MetaLabel>Next EMI</MetaLabel>
                        <MetaValue $urgent={isUrgent && !loanCompleted}>
                          {loanCompleted
                            ? "✅ Completed"
                            : `${formatDate(nextEmi)}${isUrgent ? " ⚠️" : ""}`}
                        </MetaValue>
                      </MetaItem>
                      <MetaItem>
                        <MetaLabel>EMIs Paid</MetaLabel>
                        <MetaValue>
                          {emisPaid}/{loan.tenureMonths}
                        </MetaValue>
                      </MetaItem>
                    </CardMetaRow>

                    {/* Start Date + Schedule Source Note */}
                    <StartDate>
                      Started {formatDate(loan.startDate)}
                    </StartDate>
                    {loan.scheduleGeneratedOn && (
                      <ScheduleSourceNote>
                        Based on repayment schedule dated {formatDate(loan.scheduleGeneratedOn)}
                      </ScheduleSourceNote>
                    )}
                    {(() => {
                      const pp = Array.isArray(loan.prepayments) ? loan.prepayments : [];
                      const hasManual = pp.some((p: { source?: string }) => p.source === "manual");
                      if (!hasManual) return null;
                      return (
                        <ScheduleSourceNote style={{ color: "var(--accent)", borderColor: "rgba(var(--accent-rgb, 99, 102, 241), 0.3)" }}>
                          ⚡ Balance adjusted by manual prepayments
                        </ScheduleSourceNote>
                      );
                    })()}

                    {/* Action Buttons */}
                    <ButtonRow>
                      <SmallButton
                        $variant={simulatorLoanId === loan.id ? "accent" : "outline"}
                        onClick={() => toggleSimulator(loan.id)}
                      >
                        {simulatorLoanId === loan.id
                          ? "Close Simulator"
                          : "Prepayment Simulator"}
                      </SmallButton>
                      <SmallButton
                        $variant={insightsLoanId === loan.id ? "accent" : "outline"}
                        onClick={() => toggleInsights(loan.id)}
                      >
                        {insightsLoanId === loan.id
                          ? "Hide Insights"
                          : "Insights"}
                      </SmallButton>
                    </ButtonRow>

                    {/* Prepayment Simulator (inline) */}
                    {simulatorLoanId === loan.id && (
                      <SimulatorWrapper>
                        <SimulatorTitle>
                          Prepayment Simulator
                        </SimulatorTitle>
                        <SimInputRow>
                          <DarkInput
                            type="number"
                            min="1"
                            placeholder="Enter prepayment amount"
                            value={prepaymentAmount}
                            onChange={(e) =>
                              setPrepaymentAmount(e.target.value)
                            }
                          />
                          <SmallButton
                            $variant="primary"
                            onClick={handleSimulate}
                            disabled={
                              simulating || !prepaymentAmount
                            }
                          >
                            {simulating ? "…" : "Simulate"}
                          </SmallButton>
                        </SimInputRow>

                        {simResult && (
                          <>
                            <ComparisonGrid>
                              <ComparisonColumn $side="before">
                                <CompColTitle>Before</CompColTitle>
                                <CompItem>
                                  <CompItemLabel>
                                    Total Interest
                                  </CompItemLabel>
                                  <CompItemValue>
                                    {formatCurrency(
                                      simResult.originalInterest,
                                    )}
                                  </CompItemValue>
                                </CompItem>
                                <CompItem>
                                  <CompItemLabel>Tenure</CompItemLabel>
                                  <CompItemValue>
                                    {simResult.originalTenure} mo
                                  </CompItemValue>
                                </CompItem>
                              </ComparisonColumn>

                              <ComparisonDivider />

                              <ComparisonColumn $side="after">
                                <CompColTitle>After</CompColTitle>
                                <CompItem>
                                  <CompItemLabel>
                                    Total Interest
                                  </CompItemLabel>
                                  <CompItemValue $color="var(--success)">
                                    {formatCurrency(
                                      simResult.newInterest,
                                    )}
                                  </CompItemValue>
                                </CompItem>
                                <CompItem>
                                  <CompItemLabel>Tenure</CompItemLabel>
                                  <CompItemValue $color="var(--success)">
                                    {simResult.newTenure} mo
                                  </CompItemValue>
                                </CompItem>
                              </ComparisonColumn>
                            </ComparisonGrid>

                            <SavedBanner>
                              <SavedLabel>Interest Saved</SavedLabel>
                              <SavedValue>
                                {formatCurrency(
                                  simResult.interestSaved,
                                )}
                              </SavedValue>
                            </SavedBanner>

                            {simResult.originalTenure -
                              simResult.newTenure >
                              0 && (
                              <SavedBanner
                                style={{ marginTop: 8 }}
                              >
                                <SavedLabel>
                                  Months Saved
                                </SavedLabel>
                                <SavedValue>
                                  {simResult.originalTenure -
                                    simResult.newTenure}{" "}
                                  months
                                </SavedValue>
                              </SavedBanner>
                            )}
                          </>
                        )}
                      </SimulatorWrapper>
                    )}

                    {/* Insights Panel */}
                    {insightsLoanId === loan.id && (
                      <InsightsPanel>
                        <InsightsTitle>Loan Insights</InsightsTitle>
                        {insightsLoading ? (
                          <InsightRow>
                            <InsightLabel>Loading…</InsightLabel>
                          </InsightRow>
                        ) : insightsData ? (
                          <>
                            <InsightRow>
                              <InsightLabel>
                                Total Interest Payable
                              </InsightLabel>
                              <InsightValue $color="var(--danger)">
                                {formatCurrency(
                                  insightsData.totalInterestPayable,
                                )}
                              </InsightValue>
                            </InsightRow>
                            <InsightRow>
                              <InsightLabel>
                                Months Remaining
                              </InsightLabel>
                              <InsightValue>
                                {insightsData.monthsRemaining === Infinity
                                  ? "∞"
                                  : insightsData.monthsRemaining}
                              </InsightValue>
                            </InsightRow>
                            {insightsData.prepaymentAmount != null &&
                              insightsData.earlyPayoffSavings != null && (
                                <InsightRow>
                                  <InsightLabel>
                                    Pay 1 extra EMI (
                                    {formatCurrency(
                                      insightsData.prepaymentAmount,
                                    )}
                                    )
                                  </InsightLabel>
                                  <InsightValue $color="var(--success)">
                                    Save{" "}
                                    {formatCurrency(
                                      insightsData.earlyPayoffSavings,
                                    )}
                                  </InsightValue>
                                </InsightRow>
                              )}
                            {insightsData.scenarios && insightsData.scenarios.length > 0 && (
                              <>
                                <InsightRow style={{ marginTop: 12 }}>
                                  <InsightLabel style={{ fontWeight: 700, color: "var(--warning)" }}>
                                    Early Closure Scenarios
                                  </InsightLabel>
                                </InsightRow>
                                <ScenarioTable>
                                  <ScenarioRow>
                                    <ScenarioCell>Extra/mo</ScenarioCell>
                                    <ScenarioCell>New EMI</ScenarioCell>
                                    <ScenarioCell>Closes</ScenarioCell>
                                    <ScenarioCell>Saves</ScenarioCell>
                                  </ScenarioRow>
                                  {insightsData.scenarios.map((s) => (
                                    <ScenarioRow key={s.extraMonthlyAmount}>
                                      <ScenarioCell $color="var(--accent-light)">
                                        +{formatCurrency(s.extraMonthlyAmount)}
                                      </ScenarioCell>
                                      <ScenarioCell>
                                        {formatCurrency(s.newTotalEMI)}
                                      </ScenarioCell>
                                      <ScenarioCell $color="var(--text)">
                                        {s.closureDate}
                                      </ScenarioCell>
                                      <ScenarioCell $color="var(--success)">
                                        {formatCurrency(s.interestSaved)}
                                      </ScenarioCell>
                                    </ScenarioRow>
                                  ))}
                                </ScenarioTable>
                              </>
                            )}
                          </>
                        ) : null}
                      </InsightsPanel>
                    )}


                  </LoanCard>
                );
              })}
            </LoanGrid>
          </>
        )}
      </PageWrapper>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditTarget(null);
        }}
        title={editTarget ? "Edit Loan" : "Add Loan"}
        size="md"
      >
        <LoanForm
          initialData={
            editTarget
              ? {
                  name: editTarget.name,
                  loanProvider: editTarget.loanProvider ?? undefined,
                  loanAccountNumber: editTarget.loanAccountNumber ?? undefined,
                  principalAmount: editTarget.principal,
                  interestRate: editTarget.interestRate,
                  tenureMonths: editTarget.tenureMonths,
                  emiAmount: editTarget.emiAmount,
                  startDate:
                    typeof editTarget.startDate === "string"
                      ? editTarget.startDate.split("T")[0]
                      : new Date(editTarget.startDate)
                          .toISOString()
                          .split("T")[0],
                  remainingBalance: editTarget.remainingBalance,
                }
              : scannedLoan
                ? {
                    name: scannedLoan.name ?? "",
                    loanProvider: scannedLoan.loanProvider ?? undefined,
                    loanAccountNumber: scannedLoan.loanAccountNumber ?? undefined,
                    principalAmount: scannedLoan.principal ?? 0,
                    interestRate: scannedLoan.interestRate ?? 0,
                    tenureMonths: scannedLoan.tenureMonths ?? 0,
                    emiAmount: scannedLoan.emiAmount ?? 0,
                    startDate:
                      typeof scannedLoan.startDate === "string"
                        ? scannedLoan.startDate.split("T")[0]
                        : new Date(scannedLoan.startDate ?? Date.now())
                            .toISOString()
                            .split("T")[0],
                    remainingBalance: scannedLoan.remainingBalance ?? scannedLoan.principal ?? 0,
                  }
                : undefined
          }
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
          isLoading={submitting}
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        title="Delete Loan"
        size="sm"
      >
        <ConfirmBody>
          <ConfirmText>
            Are you sure you want to delete this loan? This action cannot be
            undone.
          </ConfirmText>
          <ConfirmActions>
            <ConfirmButton
              $variant="cancel"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTargetId(null);
              }}
              disabled={submitting}
            >
              Cancel
            </ConfirmButton>
            <ConfirmButton
              $variant="danger"
              onClick={handleDeleteConfirm}
              disabled={submitting}
            >
              {submitting ? "Deleting…" : "Delete"}
            </ConfirmButton>
          </ConfirmActions>
        </ConfirmBody>
      </Modal>

      {/* EMI Schedule Modal */}
      <Modal
        isOpen={!!scheduleLoanId}
        onClose={() => {
          setScheduleLoanId(null);
          setScheduleData(null);
          setSchedulePaidOpen(false);
          setSchedulePendingOpen(true);
        }}
        title={`EMI Schedule — ${loans.find((l) => l.id === scheduleLoanId)?.name ?? ""}`}
        size="lg"
      >
        {scheduleLoading ? (
          <SchedulePanel>
            <InsightRow>
              <InsightLabel>Loading schedule…</InsightLabel>
            </InsightRow>
          </SchedulePanel>
        ) : scheduleData && scheduleData.length > 0 ? (
          (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const paidEntries = scheduleData.filter((e) => new Date(e.date) <= today);
            const pendingEntries = scheduleData.filter((e) => new Date(e.date) > today);

            const renderTable = (entries: ScheduleEntry[]) => (
              <ScheduleTableWrapper>
                <ScheduleTable>
                  <thead>
                    <tr>
                      <ScheduleTh>#</ScheduleTh>
                      <ScheduleTh>Date</ScheduleTh>
                      <ScheduleTh $align="right">EMI</ScheduleTh>
                      <ScheduleTh $align="right">Principal</ScheduleTh>
                      <ScheduleTh $align="right">Interest</ScheduleTh>
                      <ScheduleTh $align="right">Balance</ScheduleTh>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.month}>
                        <ScheduleTd>{entry.month}</ScheduleTd>
                        <ScheduleTd>
                          {new Date(entry.date).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}
                        </ScheduleTd>
                        <ScheduleTd $align="right">
                          {formatCurrency(entry.emi)}
                        </ScheduleTd>
                        <ScheduleTd $align="right" $color="var(--success)">
                          {formatCurrency(entry.principal)}
                        </ScheduleTd>
                        <ScheduleTd $align="right" $color="var(--danger)">
                          {formatCurrency(entry.interest)}
                        </ScheduleTd>
                        <ScheduleTd $align="right">
                          {formatCurrency(entry.balance)}
                        </ScheduleTd>
                      </tr>
                    ))}
                  </tbody>
                </ScheduleTable>
              </ScheduleTableWrapper>
            );

            return (
              <div>
                {/* Pending Dues — open by default */}
                {pendingEntries.length > 0 && (
                  <AccordionSection>
                    <AccordionHeader
                      $open={schedulePendingOpen}
                      onClick={() => setSchedulePendingOpen((o) => !o)}
                    >
                      <AccordionTitle $color="var(--warning)">
                        Pending Dues
                        <AccordionBadge>{pendingEntries.length}</AccordionBadge>
                      </AccordionTitle>
                      <AccordionChevron $open={schedulePendingOpen}>▼</AccordionChevron>
                    </AccordionHeader>
                    <AccordionBody $open={schedulePendingOpen}>
                      {renderTable(pendingEntries)}
                    </AccordionBody>
                  </AccordionSection>
                )}

                {/* Paid Dues — closed by default */}
                {paidEntries.length > 0 && (
                  <AccordionSection>
                    <AccordionHeader
                      $open={schedulePaidOpen}
                      onClick={() => setSchedulePaidOpen((o) => !o)}
                    >
                      <AccordionTitle $color="var(--success)">
                        Paid
                        <AccordionBadge $color="rgba(34, 197, 94, 0.15)">{paidEntries.length}</AccordionBadge>
                      </AccordionTitle>
                      <AccordionChevron $open={schedulePaidOpen}>▼</AccordionChevron>
                    </AccordionHeader>
                    <AccordionBody $open={schedulePaidOpen}>
                      {renderTable(paidEntries)}
                    </AccordionBody>
                  </AccordionSection>
                )}

                {/* Summary footer */}
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    {
                      label: "Total Payable",
                      value: scheduleData.reduce((s, e) => s + e.emi, 0),
                      color: "var(--text)",
                    },
                    {
                      label: "Principal",
                      value: scheduleData.reduce((s, e) => s + (e.principal || 0), 0),
                      color: "var(--success)",
                    },
                    {
                      label: "Interest",
                      value: scheduleData.reduce((s, e) => s + (e.interest || 0), 0),
                      color: "var(--danger)",
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                      <SummaryLabel style={{ fontSize: 10, marginBottom: 6 }}>{label}</SummaryLabel>
                      <SummaryValue $color={color} style={{ fontSize: 15, letterSpacing: "-0.5px" }}>{formatCurrency(value)}</SummaryValue>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        ) : null}
      </Modal>

      {/* Scan Schedule Modal */}
      <Modal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        title="Import from PDF"
        size="md"
        preventClose={isScanningSchedule}
      >
        <LoanScheduleScanner
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanModal(false)}
          onScanningChange={setIsScanningSchedule}
        />
      </Modal>

      {/* Prepayments Modal */}
      {(() => {
        const ppLoan = loans.find((l) => l.id === prepaymentModalLoanId);
        const ppList =
          ppLoan?.prepayments && Array.isArray(ppLoan.prepayments)
            ? (ppLoan.prepayments as { date: string; amount: number; balanceAfter?: number; source?: "scanned" | "manual" }[])
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            : [];
        const loanStart = ppLoan ? new Date(ppLoan.startDate).toISOString().split("T")[0] : "";
        const todayStr = new Date().toISOString().split("T")[0];
        return (
          <Modal
            isOpen={!!prepaymentModalLoanId}
            onClose={() => {
              setPrepaymentModalLoanId(null);
              setPpDate("");
              setPpAmount("");
            }}
            title={`Prepayments — ${ppLoan?.name ?? ""}`}
            size="md"
          >
            {/* Add Prepayment Form */}
            <div style={{ padding: "0 0 16px", borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "10px" }}>
                Add Prepayment
              </p>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Date</label>
                  <DarkInput
                    type="date"
                    value={ppDate}
                    min={loanStart}
                    max={todayStr}
                    onChange={(e) => setPpDate(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flex: "1 1 120px", minWidth: 0 }}>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>Amount (₹)</label>
                  <DarkInput
                    type="number"
                    min="1"
                    placeholder="e.g. 50000"
                    value={ppAmount}
                    onChange={(e) => setPpAmount(e.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
                <SmallButton
                  $variant="primary"
                  onClick={handleAddPrepayment}
                  disabled={ppSubmitting || !ppDate || !ppAmount}
                  style={{ height: "36px", whiteSpace: "nowrap" }}
                >
                  {ppSubmitting ? "Adding…" : "+ Add"}
                </SmallButton>
              </div>
            </div>

            {/* Prepayment List */}
            {ppList.length > 0 ? (
              <ScheduleTableWrapper>
                <ScheduleTable>
                  <thead>
                    <tr>
                      <ScheduleTh>#</ScheduleTh>
                      <ScheduleTh>Date</ScheduleTh>
                      <ScheduleTh $align="right">Amount</ScheduleTh>
                      <ScheduleTh $align="right">Balance After</ScheduleTh>
                      <ScheduleTh>Source</ScheduleTh>
                      <ScheduleTh $align="center">Action</ScheduleTh>
                    </tr>
                  </thead>
                  <tbody>
                    {ppList.map((pp, i) => {
                      const isScanned = !pp.source || pp.source === "scanned";
                      return (
                        <tr key={i}>
                          <ScheduleTd>{i + 1}</ScheduleTd>
                          <ScheduleTd>
                            {new Date(pp.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </ScheduleTd>
                          <ScheduleTd $align="right" $color="var(--success)">
                            {formatCurrency(pp.amount)}
                          </ScheduleTd>
                          <ScheduleTd $align="right">
                            {pp.balanceAfter != null
                              ? formatCurrency(pp.balanceAfter)
                              : "—"}
                          </ScheduleTd>
                          <ScheduleTd>
                            <span style={{
                              fontSize: "10px",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              background: isScanned
                                ? "rgba(var(--accent-rgb, 99, 102, 241), 0.15)"
                                : "rgba(34, 197, 94, 0.15)",
                              color: isScanned ? "var(--accent)" : "var(--success, #22c55e)",
                            }}>
                              {isScanned ? "🔖 Statement" : "✏️ Manual"}
                            </span>
                          </ScheduleTd>
                          <ScheduleTd $align="center">
                            {isScanned ? (
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }} title="Extracted from loan statement — cannot remove">🔒</span>
                            ) : (
                              <IconButton
                                title="Remove prepayment"
                                onClick={() => handleRemovePrepayment(i)}
                                style={{ color: "var(--danger)" }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" />
                                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                </svg>
                              </IconButton>
                            )}
                          </ScheduleTd>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <ScheduleTd colSpan={2}>
                        <strong>Total Prepaid</strong>
                      </ScheduleTd>
                      <ScheduleTd $align="right" $color="var(--success)">
                        <strong>
                          {formatCurrency(
                            ppList.reduce((s, p) => s + p.amount, 0),
                          )}
                        </strong>
                      </ScheduleTd>
                      <ScheduleTd colSpan={3} />
                    </tr>
                  </tfoot>
                </ScheduleTable>
              </ScheduleTableWrapper>
            ) : (
              <SchedulePanel style={{ marginTop: "16px" }}>
                <InsightLabel>No prepayments recorded. Use the form above to add one.</InsightLabel>
              </SchedulePanel>
            )}
          </Modal>
        );
      })()}
    </>
  );
}
