"use client";

import styled from "styled-components";
import {
  HistorySection,
  HistoryToggle,
  HistoryList,
  HistoryItem,
  HistoryDot,
  HistoryInfo,
  HistoryReason,
  HistoryChange,
  HistoryAccountName,
  HistoryTotal,
  HistoryDate,
  LoadMoreBtn,
} from "../_styled";
import { BalanceLogItem, formatCurrency, reasonLabel } from "../_utils";

const HistoryPlaceholder = styled(HistoryDate)`
  text-align: center;
  padding: 16px;
`;

type Props = {
  show: boolean;
  onToggle: () => void;
  loading: boolean;
  items: BalanceLogItem[];
  cursor: string | null;
  onLoadMore: (cursor: string) => void;
};

export default function BalanceHistorySection({
  show,
  onToggle,
  loading,
  items,
  cursor,
  onLoadMore,
}: Props) {
  return (
    <HistorySection>
      <HistoryToggle onClick={onToggle}>
        Balance History
        <span>{show ? "▲" : "▼"}</span>
      </HistoryToggle>
      {show && (
        <HistoryList>
          {loading && items.length === 0 ? (
            <HistoryPlaceholder>Loading…</HistoryPlaceholder>
          ) : items.length === 0 ? (
            <HistoryPlaceholder>No history yet</HistoryPlaceholder>
          ) : (
            <>
              {items.map((item) => (
                <HistoryItem key={item.id}>
                  <HistoryDot $positive={item.change >= 0} />
                  <HistoryInfo>
                    <div>
                      <HistoryReason $reason={item.reason}>
                        {reasonLabel(item.reason)}
                      </HistoryReason>
                      <HistoryChange $positive={item.change >= 0}>
                        {item.change >= 0 ? "+" : ""}{formatCurrency(item.change)}
                      </HistoryChange>
                    </div>
                    <HistoryAccountName>{item.accountName}</HistoryAccountName>
                  </HistoryInfo>
                  <HistoryTotal>{formatCurrency(item.totalBalance)}</HistoryTotal>
                  <HistoryDate>
                    {new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </HistoryDate>
                </HistoryItem>
              ))}
              {cursor && (
                <LoadMoreBtn
                  disabled={loading}
                  onClick={() => onLoadMore(cursor)}
                >
                  {loading ? "Loading…" : "Load more"}
                </LoadMoreBtn>
              )}
            </>
          )}
        </HistoryList>
      )}
    </HistorySection>
  );
}
