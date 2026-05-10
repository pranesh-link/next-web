"use client";

/**
 * Styled atoms for the budget planner period/income header row.
 *
 * Groups the mode toggle pills, month selector with arrow buttons, top
 * income input pill, top action buttons, and label. Used only by
 * `PeriodHeader.tsx`.
 */

import styled from "styled-components";
import { EASING } from "../_utils";

export const ModeToggle = styled.div`
  display: inline-flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 20px;
`;

export const ModeButton = styled.button<{ $active: boolean }>`
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  background: ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : "var(--text-muted)")};

  &:hover {
    background: ${(p) => (p.$active ? "var(--accent)" : "var(--surface-hover)")};
  }
`;

export const MonthSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

export const TopIncomeGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);

  label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.4px;
    color: var(--text-muted);
    text-transform: uppercase;
    white-space: nowrap;
  }

  input {
    width: 130px;
    border: none;
    background: transparent;
    padding: 6px 4px;
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    font-family: inherit;
    outline: none;

    &::placeholder {
      color: var(--text-muted);
      font-weight: 500;
    }

    @media (max-width: 480px) {
      width: 100px;
    }
  }
`;

export const TopActionGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
`;

export const IconActionButton = styled.button<{ $variant?: "primary" | "neutral" | "danger" }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid
    ${(p) =>
      p.$variant === "primary"
        ? "var(--accent)"
        : p.$variant === "danger"
          ? "rgba(239, 68, 68, 0.4)"
          : "var(--border)"};
  background: ${(p) =>
    p.$variant === "primary"
      ? "var(--accent)"
      : p.$variant === "danger"
        ? "rgba(239, 68, 68, 0.08)"
        : "var(--surface)"};
  color: ${(p) =>
    p.$variant === "primary"
      ? "#fff"
      : p.$variant === "danger"
        ? "var(--danger)"
        : "var(--text)"};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const MonthArrowButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface-hover);
    border-color: var(--border-strong);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const MonthLabel = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.3px;
  text-align: center;

  @media (max-width: 480px) {
    font-size: 16px;
  }
`;

export const MonthInput = styled.input`
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s ${EASING};

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`;
