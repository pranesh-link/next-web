"use client";

import styled, { keyframes } from "styled-components";
import { EASING } from "@/couple/_constants/theme";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/** Result-card container for parsed loan details. */
export const ResultCard = styled.div`
  background: rgba(34, 197, 94, 0.06);
  border: 1px solid rgba(34, 197, 94, 0.2);
  border-radius: 12px;
  padding: 20px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

/** Title above the result card. */
export const ResultTitle = styled.p`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--success);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

/** A single labelled row inside the result card. */
export const ResultRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;

  & + & {
    border-top: 1px solid rgba(34, 197, 94, 0.1);
  }
`;

/** Result row label. */
export const ResultLabel = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

/** Result row value. */
export const ResultValue = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
`;

/** Italic caption beneath the result rows. */
export const ScheduleInfo = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 8px 0 0;
  font-style: italic;
`;

/** Container for the prepayment list section. */
export const PrepaymentSection = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(var(--accent-rgb, 99, 102, 241), 0.08);
  border-radius: 8px;
  border: 1px solid rgba(var(--accent-rgb, 99, 102, 241), 0.15);
`;

/** Title for the prepayment section. */
export const PrepaymentTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 8px;
`;

/** Single prepayment row. */
export const PrepaymentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  font-size: 12px;
  color: var(--text-muted);
  border-bottom: 1px solid rgba(var(--border-rgb, 255, 255, 255), 0.06);

  &:last-of-type {
    border-bottom: none;
  }
`;

/** Date column inside a prepayment row. */
export const PrepaymentDate = styled.span`
  min-width: 90px;
`;

/** Amount column inside a prepayment row. */
export const PrepaymentAmount = styled.span`
  font-weight: 600;
  color: var(--success, #22c55e);
`;

/** Balance-after column inside a prepayment row. */
export const PrepaymentBalance = styled.span`
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
`;

/** Total prepaid summary line. */
export const PrepaymentTotal = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(var(--border-rgb, 255, 255, 255), 0.1);
  font-size: 13px;
  font-weight: 600;
  color: var(--success, #22c55e);
`;

/** Pill badge for OCR confidence. */
export const ConfidenceBadge = styled.span<{ $level: "high" | "medium" | "low" }>`
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  background: ${(p) =>
    p.$level === "high"
      ? "rgba(34, 197, 94, 0.15)"
      : p.$level === "medium"
        ? "rgba(245, 158, 11, 0.15)"
        : "rgba(239, 68, 68, 0.15)"};
  color: ${(p) =>
    p.$level === "high"
      ? "var(--success)"
      : p.$level === "medium"
        ? "var(--warning)"
        : "var(--danger)"};
`;
