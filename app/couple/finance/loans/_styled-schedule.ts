"use client";

/**
 * Styled atoms for the loan schedule table panel and shared insight rows.
 *
 * Used by the schedule modal, prepayments modal, and insights panel.
 * Imported through `_styled.ts` for consistency.
 */

import styled from "styled-components";
import { EASING, fadeIn } from "./_styled-keyframes";

export const SchedulePanel = styled.div`
  margin-top: 16px;
  padding: 20px;
  background: rgba(59, 130, 246, 0.04);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

export const ScheduleTableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 0 4px;
`;

export const ScheduleTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 480px;
`;

export const ScheduleTh = styled.th<{ $align?: string }>`
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

export const ScheduleTd = styled.td<{ $align?: string; $color?: string }>`
  text-align: ${(p) => p.$align ?? "left"};
  padding: 7px 10px;
  color: ${(p) => p.$color ?? "var(--text-dim)"};
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
`;
