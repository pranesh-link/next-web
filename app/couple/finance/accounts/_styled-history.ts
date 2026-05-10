"use client";

/**
 * Styled atoms for the balance-history section on the accounts list page.
 *
 * Groups the collapsible history panel, list rows, dot/reason/change badges,
 * and load-more button. Imported through `_styled.ts` for consistency.
 */

import styled from "styled-components";
import { EASING } from "./_utils";

export const HistorySection = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  margin-bottom: 24px;
  overflow: hidden;
`;

export const HistoryToggle = styled.button`
  width: 100%;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: color 0.15s ${EASING};

  &:hover { color: var(--text); }

  @media (max-width: 480px) {
    padding: 14px 16px;
  }
`;

export const HistoryList = styled.div`
  padding: 0 24px 16px;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    padding: 0 16px 12px;
  }
`;

export const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  &:last-child { border-bottom: none; }

  @media (max-width: 480px) {
    gap: 8px;
    flex-wrap: wrap;
  }
`;

export const HistoryDot = styled.div<{ $positive: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => (p.$positive ? "#22c55e" : "#ef4444")};
  flex-shrink: 0;
`;

export const HistoryInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const HistoryReason = styled.span<{ $reason: string }>`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 6px;
  background: ${(p) =>
    p.$reason === "ACCOUNT_ADDED" ? "rgba(34,197,94,0.1)" :
    p.$reason === "ACCOUNT_REMOVED" ? "rgba(239,68,68,0.1)" :
    "rgba(59,130,246,0.1)"};
  color: ${(p) =>
    p.$reason === "ACCOUNT_ADDED" ? "#16a34a" :
    p.$reason === "ACCOUNT_REMOVED" ? "#ef4444" :
    "#3b82f6"};
`;

export const HistoryChange = styled.span<{ $positive: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$positive ? "#22c55e" : "#ef4444")};
`;

export const HistoryTotal = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
`;

export const HistoryDate = styled.div`
  font-size: 11px;
  color: var(--text-muted);
`;

export const HistoryAccountName = styled.span`
  font-size: 12px;
  color: var(--text-muted);
`;

export const LoadMoreBtn = styled.button`
  width: 100%;
  padding: 10px;
  border: none;
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 8px;
  margin-top: 8px;
  transition: all 0.15s ${EASING};
  &:hover { color: var(--accent); }
`;
