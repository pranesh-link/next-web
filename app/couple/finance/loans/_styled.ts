"use client";

/**
 * Public styled-component entry point for the loans page.
 *
 * Houses page wrapper, shared inputs/buttons, insight rows, summary value
 * atoms, import bar, and notification banner. Re-exports keyframes and the
 * schedule-table atoms from sibling `_styled-*.ts` files so existing
 * `from "./_styled"` and `from "../_styled"` imports continue to work.
 */

import styled from "styled-components";
import { EASING, fadeOut, slideDown } from "./_styled-keyframes";

export { EASING, fadeIn, fadeOut, fillExpand, slideDown } from "./_styled-keyframes";
export * from "./_styled-schedule";

/* ── Page wrapper ── */

export const PageWrapper = styled.div`
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

/* ── Shared inputs / buttons ── */

export const DarkInput = styled.input`
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ${EASING};

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

export const SmallButton = styled.button<{
  $variant?: "primary" | "outline" | "accent" | "orange" | "green";
}>`
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  background: ${(p) =>
    p.$variant === "primary"
      ? "var(--accent)"
      : p.$variant === "accent"
        ? "rgba(59, 130, 246, 0.1)"
        : p.$variant === "orange"
          ? "rgba(234, 130, 50, 0.15)"
          : p.$variant === "green"
            ? "rgba(34, 197, 94, 0.12)"
            : "transparent"};
  color: ${(p) =>
    p.$variant === "primary"
      ? "#fff"
      : p.$variant === "accent"
        ? "var(--accent-light)"
        : p.$variant === "orange"
          ? "rgb(194, 100, 20)"
          : p.$variant === "green"
            ? "rgb(22, 163, 74)"
            : "var(--text-dim)"};
  border-color: ${(p) =>
    p.$variant === "primary"
      ? "var(--accent)"
      : p.$variant === "accent"
        ? "rgba(59, 130, 246, 0.3)"
        : p.$variant === "orange"
          ? "rgba(234, 130, 50, 0.4)"
          : p.$variant === "green"
            ? "rgba(34, 197, 94, 0.35)"
            : "var(--border)"};

  &:hover {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const IconButton = styled.button<{ $variant?: "edit" | "delete" }>`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface-hover);
    color: ${(p) =>
      p.$variant === "delete" ? "var(--danger)" : "var(--accent)"};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

/* ── Schedule table moved to _styled-schedule.ts ── */

/* ── Insight rows (used in insights + schedule loading + prepayments empty) ── */

export const InsightRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;

  & + & {
    border-top: 1px solid rgba(245, 158, 11, 0.1);
  }
`;

export const InsightLabel = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

export const InsightValue = styled.span<{ $color?: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.$color ?? "var(--text)"};
`;

/* ── Summary value/label (shared with schedule modal footer) ── */

export const SummaryLabel = styled.p`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin: 0 0 8px 0;
`;

export const SummaryValue = styled.p<{ $color?: string }>`
  font-size: 24px;
  font-weight: 800;
  color: ${(p) => p.$color ?? "var(--text)"};
  margin: 0;
  letter-spacing: -1px;
`;

/* ── Import bar ── */

export const ImportBar = styled.div`
  margin-bottom: 16px;
`;

export const ImportButton = styled.button`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.25);
  color: var(--accent-light);
  border-radius: 10px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: var(--accent);
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
    transform: translateY(-1px);
  }
`;

/* ── Notification ── */

export const NotificationBanner = styled.div<{
  $type: "success" | "error";
  $leaving: boolean;
}>`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: ${(p) =>
    p.$type === "success"
      ? "rgba(34, 197, 94, 0.15)"
      : "rgba(239, 68, 68, 0.15)"};
  border: 1px solid
    ${(p) =>
      p.$type === "success"
        ? "rgba(34, 197, 94, 0.4)"
        : "rgba(239, 68, 68, 0.4)"};
  color: ${(p) =>
    p.$type === "success" ? "var(--success)" : "var(--danger)"};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
  pointer-events: none;
`;

export const ErrorBanner = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 20px 24px;
  color: var(--danger);
  font-size: 14px;
  text-align: center;
  margin-bottom: 24px;
`;
