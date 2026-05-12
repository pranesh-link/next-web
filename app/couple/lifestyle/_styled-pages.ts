"use client";

import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

/** Top-level page wrapper — consistent padding and no horizontal overflow. */
export const PageWrapper = styled.main`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  overflow-x: hidden;

  @media (max-width: 768px) {
    padding: 16px;
    gap: 16px;
  }
`;

/** Grid of summary stat cards — adapts from 4 → 2 → 1 column. */
export const SummaryGrid = styled.div<{ $cols?: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols ?? 4}, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** Elevated surface card used for stats and content sections. */
export const Card = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  min-width: 0;
`;

/** Small muted label above a stat value. */
export const StatLabel = styled.p`
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

/** Large numeric stat value. */
export const StatValue = styled.p`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
`;

/** Horizontal row housing a date input, left-aligned. */
export const DateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  input[type="date"] {
    padding: 8px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font-family: inherit;
    font-size: 14px;
    cursor: pointer;

    &:focus {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  }
`;

/**
 * Expandable inline add-entry form.
 * Collapses to a single column on narrow viewports.
 */
export const DailyForm = styled.form`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  padding: 20px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

/** Single labeled form field — label stacked above input. */
export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

/** Form field label. */
export const FieldLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
`;

/** Styled text / number input. */
export const TextInput = styled.input`
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

/** Styled select input matching {@link TextInput}. */
export const SelectInput = styled.select`
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;

/** Row of form action buttons spanning the full form grid. */
export const FormActions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

/** Primary accent button. */
export const PrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition:
    transform 0.2s ${EASING},
    filter 0.2s ${EASING};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/** Ghost / outline button. */
export const GhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ${EASING};

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
`;

/** Danger / delete icon button (small, no background). */
export const DeleteBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.15s ${EASING};
  flex-shrink: 0;

  &:hover {
    color: var(--danger);
  }
`;

/** Horizontal log list item row with name, meta and delete aligned. */
export const LogItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;

  span:first-child {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text);
  }

  span.meta {
    color: var(--text-muted);
    white-space: nowrap;
  }
`;

/** Section heading. */
export const SectionTitle = styled.h2`
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
`;

/** Empty-state hint text. */
export const EmptyText = styled.p`
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
  text-align: center;
  padding: 32px 0;
`;
