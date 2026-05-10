"use client";

import styled from "styled-components";

/** Outer card wrapping the table / mobile list. */
export const Wrapper = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
`;

/** Horizontally scrollable container for the desktop table; hidden on mobile. */
export const ScrollContainer = styled.div`
  overflow-x: auto;

  @media screen and (max-width: 480px) {
    display: none;
  }
`;

/** Base table element. */
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

/** Table header band. */
export const THead = styled.thead`
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
`;

/** Table header cell; pass `$align` to override text alignment. */
export const Th = styled.th<{ $align?: string }>`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  padding: 14px 16px;
  text-align: ${(p) => p.$align || "left"};
  white-space: nowrap;
`;

/** Table row with hover styling. */
export const TRow = styled.tr`
  border-bottom: 1px solid var(--border);
  transition: background 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--surface-hover);
  }
`;

/** Table data cell; pass `$align` to override text alignment. */
export const Td = styled.td<{ $align?: string }>`
  padding: 14px 16px;
  font-size: 14px;
  color: var(--text-dim);
  text-align: ${(p) => p.$align || "left"};
  white-space: nowrap;
`;

/** Primary description line for a transaction. */
export const Description = styled.p`
  color: var(--text);
  font-weight: 500;
  font-size: 14px;
  margin: 0;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** Sub-line account-name caption under the description. */
export const AccountName = styled.p`
  font-size: 12px;
  color: var(--text-muted);
  margin: 2px 0 0 0;
`;

/** Date text in the row. */
export const DateText = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

/** Amount cell coloured by transaction type. */
export const Amount = styled.span<{ $type: "INCOME" | "EXPENSE" }>`
  font-weight: 700;
  font-size: 14px;
  color: ${(p) => (p.$type === "INCOME" ? "#22c55e" : "#ef4444")};
`;

/** Pill-shaped category badge. */
export const CategoryBadge = styled.span`
  display: inline-block;
  background: rgba(59, 130, 246, 0.1);
  color: var(--accent-light);
  border-radius: 16px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
`;

/** Right-aligned wrapper for action buttons. */
export const ActionsCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
`;

/** Icon button used for edit/delete; tinted on hover by `$variant`. */
export const ActionButton = styled.button<{ $variant: "edit" | "delete" }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    background: var(--surface-hover);
    color: ${(p) => (p.$variant === "edit" ? "var(--accent)" : "var(--danger)")};
  }
`;

/** Container for the mobile-only card list; hidden above 480px. */
export const MobileList = styled.div`
  display: none;

  @media screen and (max-width: 480px) {
    display: flex;
    flex-direction: column;
  }
`;

/** Single mobile transaction card. */
export const MobileCard = styled.div`
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: background 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--surface-hover);
  }
`;

/** Horizontal row inside a mobile card. */
export const MobileRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/** Meta cluster (badge + date) inside a mobile card. */
export const MobileMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

/** Empty-state container. */
export const EmptyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  gap: 8px;
`;

/** Empty-state icon (svg). */
export const EmptyIcon = styled.svg`
  width: 40px;
  height: 40px;
  color: var(--text-muted);
`;

/** Empty-state label. */
export const EmptyText = styled.p`
  font-size: 14px;
  color: var(--text-dim);
  margin: 0;
`;

/** "Add your first transaction" CTA. */
export const AddButton = styled.button`
  margin-top: 4px;
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-light);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    border-color: var(--accent);
    background: rgba(59, 130, 246, 0.08);
  }
`;
