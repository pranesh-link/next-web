"use client";

import styled from "styled-components";
import {
  Section,
  SectionTitle,
  FilterTabs,
  FilterTab,
  EmptyHistory,
  Timeline,
  HistoryItem,
  HistoryDot,
  HistoryInfo,
  SourceBadge,
  HistoryChange,
  ActivityDescription,
  HistoryBalance,
  HistoryDate,
  LoadMoreButton,
} from "../_styled";
import { ActivityFilter, ActivityItem, formatCurrency, formatDateTime } from "../_utils";

const SourceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

type Props = {
  filter: ActivityFilter;
  onFilterChange: (f: ActivityFilter) => void;
  loading: boolean;
  items: ActivityItem[];
  nextCursor: string | null;
  loadingMore: boolean;
  onLoadMore: (cursor: string) => void;
};

export default function ActivitySection({
  filter,
  onFilterChange,
  loading,
  items,
  nextCursor,
  loadingMore,
  onLoadMore,
}: Props) {
  const filtered = items.filter(
    (item) => filter === "all" || item.source === filter
  );

  return (
    <Section>
      <SectionTitle>Account Activity</SectionTitle>
      <FilterTabs>
        <FilterTab $active={filter === "all"} onClick={() => onFilterChange("all")}>
          All
        </FilterTab>
        <FilterTab $active={filter === "balance"} onClick={() => onFilterChange("balance")}>
          Balance Updates
        </FilterTab>
        <FilterTab $active={filter === "transaction"} onClick={() => onFilterChange("transaction")}>
          Transactions
        </FilterTab>
      </FilterTabs>
      {loading ? (
        <EmptyHistory>Loading…</EmptyHistory>
      ) : filtered.length === 0 ? (
        <EmptyHistory>
          {filter === "all" ? "No activity yet" : `No ${filter === "balance" ? "balance updates" : "transactions"} yet`}
        </EmptyHistory>
      ) : (
        <>
          <Timeline>
            {filtered.map((item) => (
              <HistoryItem key={`${item.source}-${item.id}`}>
                <HistoryDot $positive={item.change >= 0} />
                <HistoryInfo>
                  <SourceRow>
                    <SourceBadge $source={item.source}>
                      {item.source === "balance" ? "Balance" : "Txn"}
                    </SourceBadge>
                    <HistoryChange $positive={item.change >= 0}>
                      {item.change >= 0 ? "+" : ""}
                      {formatCurrency(item.change)}
                    </HistoryChange>
                  </SourceRow>
                  {item.note && <ActivityDescription>{item.note}</ActivityDescription>}
                  {item.description && (
                    <ActivityDescription>
                      {item.description}{item.category ? ` · ${item.category}` : ""}
                    </ActivityDescription>
                  )}
                </HistoryInfo>
                {item.source === "balance" && item.balance > 0 && (
                  <HistoryBalance>{formatCurrency(item.balance)}</HistoryBalance>
                )}
                <HistoryDate>{formatDateTime(item.date)}</HistoryDate>
              </HistoryItem>
            ))}
          </Timeline>
          {nextCursor && (
            <LoadMoreButton
              disabled={loadingMore}
              onClick={() => onLoadMore(nextCursor)}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </LoadMoreButton>
          )}
        </>
      )}
    </Section>
  );
}
