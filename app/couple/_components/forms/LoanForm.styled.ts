import styled, { keyframes } from "styled-components";
import { FinanceButtonOutline } from "@/couple/_components/theme/styled-primitives";

/** Top-level form grid; mobile-first single column with reduced gap on small screens. */
export const FormWrapper = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media screen and (max-width: 480px) {
    gap: 16px;
  }
`;

/** Wrapper around a label + input + error trio. */
export const FieldGroup = styled.div``;

/** Two-column responsive grid that collapses to one column on small screens. */
export const TwoColGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media screen and (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** Row pairing the EMI input with the "Calculate EMI" button. */
export const EmiRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

/** Flex-growing wrapper for the EMI input inside {@link EmiRow}. */
export const EmiInputWrap = styled.div`
  flex: 1;
`;

/** Calculate-EMI button variant — bottom-aligned, non-shrinking. */
export const CalcButton = styled(FinanceButtonOutline)`
  flex-shrink: 0;
  white-space: nowrap;
  align-self: flex-end;
`;

/** Card container for the EMI summary (totals). */
export const SummaryBox = styled.div`
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
`;

/** Single label/value row inside {@link SummaryBox}. */
export const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & + & {
    margin-top: 8px;
  }
`;

/** Muted label text inside {@link SummaryRow}. */
export const SummaryLabel = styled.span`
  font-size: 13px;
  color: #64748b;
`;

/** Summary value text; tinted red when `$danger` is true. */
export const SummaryValue = styled.span<{ $danger?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => (p.$danger ? "#dc2626" : "#1e293b")};
`;

/** Action row containing the submit and cancel buttons. */
export const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 4px;
`;

/** Dashed call-to-action button that opens the PDF schedule scanner. */
export const ImportPdfButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.08));
  border: 1px dashed rgba(59, 130, 246, 0.3);
  color: var(--accent-light, #60a5fa);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.12));
  }
`;

/** Pill badge used to display read-only loan provider / account number metadata. */
export const AccountNumberBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-light, #60a5fa);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.3px;
`;

/** Tinted container that wraps the inline {@link LoanScheduleScanner}. */
export const ScannerWrapper = styled.div`
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.03);
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/** Inline rotating spinner shown next to the submit label while loading. */
export const Spinner = styled.svg`
  width: 16px;
  height: 16px;
  margin-right: 8px;
  animation: ${spin} 0.7s linear infinite;
`;
