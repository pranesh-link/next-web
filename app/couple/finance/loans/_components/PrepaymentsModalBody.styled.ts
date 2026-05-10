"use client";

import styled from "styled-components";
import {
  DarkInput,
  IconButton,
  SchedulePanel,
  SmallButton,
} from "../_styled";

/**
 * Wrapper for the "Add Prepayment" form section above the prepayments list.
 */
export const AddPrepaymentSection = styled.div`
  padding: 0 0 16px;
  border-bottom: 1px solid var(--border);
`;

export const AddPrepaymentTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 10px;
`;

export const AddPrepaymentRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-end;
  flex-wrap: wrap;
`;

export const FieldGroup = styled.div<{ $minBasis?: string }>`
  flex: 1 1 ${(p) => p.$minBasis ?? "140px"};
  min-width: 0;
`;

export const FieldLabel = styled.label`
  font-size: 11px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 4px;
`;

export const FullWidthInput = styled(DarkInput)`
  width: 100%;
`;

export const AddPrepaymentButton = styled(SmallButton)`
  height: 36px;
  white-space: nowrap;
`;

export const SourceBadge = styled.span<{ $scanned: boolean }>`
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: ${(p) =>
    p.$scanned
      ? "rgba(var(--accent-rgb, 99, 102, 241), 0.15)"
      : "rgba(34, 197, 94, 0.15)"};
  color: ${(p) => (p.$scanned ? "var(--accent)" : "var(--success, #22c55e)")};
`;

export const LockedMarker = styled.span`
  font-size: 11px;
  color: var(--text-muted);
`;

export const RemovePrepaymentButton = styled(IconButton)`
  color: var(--danger);
`;

export const EmptyPanel = styled(SchedulePanel)`
  margin-top: 16px;
`;
