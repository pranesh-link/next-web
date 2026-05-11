"use client";

import styled from "styled-components";
import Modal from "@/couple/_components/shared/Modal";
import { ConfirmBody, ConfirmActions, ConfirmButton } from "../_styled";
import { IMPORT_PREV_MONTHLY, IMPORT_PREV_YEARLY, SELECTABLE, SELECT_ALL, SELECT_NONE, NO_ITEMS_TO_IMPORT, UNCATEGORISED, BADGE_ALREADY_ADDED, BADGE_SIMILAR, BADGE_PAID, CANCEL, IMPORT } from "../_labels";
import { EASING, formatCurrency, type PrevItemRow } from "../_utils";

const ImportToolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 8px 0 12px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-muted);
`;

const ImportLinkButton = styled.button`
  background: none;
  border: none;
  color: var(--accent);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: inherit;

  &:hover { background: rgba(99, 102, 241, 0.08); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ImportListWrapper = styled.div`
  max-height: 50vh;
  overflow-y: auto;
  margin: 0 -8px 16px;
  padding: 0 8px;
`;

const ImportRow = styled.label<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 8px;
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.$disabled ? 0.65 : 1)};
  transition: background 0.15s ${EASING};

  &:hover {
    background: ${(p) => (p.$disabled ? "transparent" : "rgba(99, 102, 241, 0.06)")};
  }

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--accent);
    cursor: inherit;
    flex-shrink: 0;
  }
`;

const ImportRowMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ImportRowLine1 = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
`;

const ImportRowAmount = styled.span`
  color: var(--accent);
`;

const ImportRowNote = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ImportRowBadges = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
`;

const ImportRowBadge = styled.span<{ $variant: "duplicate" | "similar" | "paid" }>`
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 12px;
  letter-spacing: 0.2px;
  white-space: nowrap;

  background: ${(p) =>
    p.$variant === "duplicate"
      ? "rgba(239, 68, 68, 0.12)"
      : p.$variant === "similar"
        ? "rgba(245, 158, 11, 0.15)"
        : "rgba(34, 197, 94, 0.15)"};
  color: ${(p) =>
    p.$variant === "duplicate"
      ? "#ef4444"
      : p.$variant === "similar"
        ? "#d97706"
        : "#22c55e"};
`;

const ImportEmpty = styled.div`
  text-align: center;
  padding: 24px 12px;
  color: var(--text-muted);
  font-size: 14px;
`;

type Props = {
  isOpen: boolean;
  mode: "monthly" | "yearly";
  importRows: PrevItemRow[];
  importSelection: Set<number>;
  onClose: () => void;
  onToggleRow: (idx: number) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onConfirm: () => void;
};

export default function ImportPrevModal({
  isOpen,
  mode,
  importRows,
  importSelection,
  onClose,
  onToggleRow,
  onSelectAll,
  onSelectNone,
  onConfirm,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "monthly" ? IMPORT_PREV_MONTHLY : IMPORT_PREV_YEARLY}
      size="md"
    >
      <ConfirmBody>
        <ImportToolbar>
          <span>
            {importSelection.size} of{" "}
            {importRows.filter((r) => r._class.kind !== "duplicate").length} {SELECTABLE}
          </span>
          <div>
            <ImportLinkButton
              onClick={onSelectAll}
              disabled={importRows.every((r) => r._class.kind === "duplicate")}
            >
              {SELECT_ALL}
            </ImportLinkButton>
            <ImportLinkButton onClick={onSelectNone} disabled={importSelection.size === 0}>
              {SELECT_NONE}
            </ImportLinkButton>
          </div>
        </ImportToolbar>

        {importRows.length === 0 ? (
          <ImportEmpty>{NO_ITEMS_TO_IMPORT}</ImportEmpty>
        ) : (
          <ImportListWrapper>
            {importRows.map((row) => {
              const isDup = row._class.kind === "duplicate";
              const isChecked = importSelection.has(row._idx);
              return (
                <ImportRow key={row._idx} $disabled={isDup}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDup}
                    onChange={() => onToggleRow(row._idx)}
                  />
                  <ImportRowMain>
                    <ImportRowLine1>
                      <span>{row.category || UNCATEGORISED}</span>
                      <ImportRowAmount>{formatCurrency(row.amount)}</ImportRowAmount>
                    </ImportRowLine1>
                    {row.note && <ImportRowNote>{row.note}</ImportRowNote>}
                  </ImportRowMain>
                  <ImportRowBadges>
                    {row._class.kind === "duplicate" && (
                      <ImportRowBadge $variant="duplicate">{BADGE_ALREADY_ADDED}</ImportRowBadge>
                    )}
                    {row._class.kind === "similar" && (
                      <ImportRowBadge $variant="similar">
                        {BADGE_SIMILAR} ({formatCurrency(row._class.existingAmount)})
                      </ImportRowBadge>
                    )}
                    {row.paid && <ImportRowBadge $variant="paid">{BADGE_PAID}</ImportRowBadge>}
                  </ImportRowBadges>
                </ImportRow>
              );
            })}
          </ImportListWrapper>
        )}

        <ConfirmActions>
          <ConfirmButton $variant="cancel" onClick={onClose}>
            {CANCEL}
          </ConfirmButton>
          <ConfirmButton
            $variant="primary"
            onClick={onConfirm}
            disabled={importSelection.size === 0}
          >
            {IMPORT} {importSelection.size > 0 ? importSelection.size : ""}
          </ConfirmButton>
        </ConfirmActions>
      </ConfirmBody>
    </Modal>
  );
}
