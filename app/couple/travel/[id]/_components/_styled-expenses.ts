import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

/** Budget summary bar at the top of the expenses tab. */
export const SummaryBar = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

/** Muted label inside the summary bar. */
export const SummaryLabel = styled.span`
  font-size: 13px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 2px;
`;

/** Large amount in the summary bar, red when over budget. */
export const SummaryAmount = styled.span<{ $over: boolean }>`
  font-size: 20px;
  font-weight: 700;
  color: ${(p) => (p.$over ? "var(--danger)" : "var(--text)")};
`;

/** Thin progress track bar. */
export const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  background: var(--surface);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
`;

/** Filled portion of the progress track. */
export const ProgressFill = styled.div<{ $pct: number; $over: boolean }>`
  height: 100%;
  width: ${(p) => Math.min(p.$pct, 100)}%;
  background: ${(p) => (p.$over ? "var(--danger)" : "var(--accent)")};
  border-radius: 3px;
  transition: width 0.4s ${EASING};
`;

/** Vertical list of expense rows. */
export const ExpenseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/** Single expense row card. */
export const ExpenseRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
`;

/** Flex-grow info section within an expense row. */
export const ExpenseInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

/** Expense title. */
export const ExpenseTitle = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin: 0 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** Expense category + date meta line. */
export const ExpenseMeta = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 0;
`;

/** Right-aligned amount label. */
export const ExpenseAmount = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
`;

/** Category breakdown section. */
export const CategoryBreakdown = styled.div`
  margin-top: 20px;

  h4 {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-muted);
    margin: 0 0 10px;
  }
`;

/** One row in the category breakdown. */
export const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }

  span:last-child {
    font-weight: 600;
    color: var(--text);
  }
`;
