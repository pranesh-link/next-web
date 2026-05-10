"use client";

/**
 * Styled atoms for the account detail history timeline and filter tabs.
 *
 * Groups timeline rows, dot/change/balance/date labels, empty/load-more
 * states, filter-tab pills, source badge, and activity description text.
 * Imported through `_styled.ts` for consistency.
 */

import styled from "styled-components";
import { EASING } from "./_utils";

export const Timeline = styled.div`
  display: flex;
  flex-direction: column;
`;

export const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }

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

export const HistoryChange = styled.span<{ $positive: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => (p.$positive ? "#22c55e" : "#ef4444")};
`;

export const HistoryBalance = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
`;

export const HistoryDate = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
`;

export const EmptyHistory = styled.div`
  text-align: center;
  padding: 24px;
  font-size: 14px;
  color: var(--text-muted);
`;

export const LoadMoreButton = styled.button`
  width: 100%;
  padding: 12px;
  margin-top: 8px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  &:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const FilterTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
  background: var(--surface);
  border-radius: 10px;
  padding: 3px;
`;

export const FilterTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};
  background: ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : "var(--text-muted)")};

  &:hover:not(:disabled) {
    background: ${(p) => (p.$active ? "var(--accent)" : "rgba(0,0,0,0.04)")};
  }
`;

export const SourceBadge = styled.span<{ $source: "balance" | "transaction" }>`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${(p) =>
    p.$source === "balance"
      ? "rgba(59, 130, 246, 0.1)"
      : "rgba(168, 85, 247, 0.1)"};
  color: ${(p) =>
    p.$source === "balance" ? "#3b82f6" : "#a855f7"};
  flex-shrink: 0;
`;

export const ActivityDescription = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
`;
