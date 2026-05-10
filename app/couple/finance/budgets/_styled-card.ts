"use client";

import styled from "styled-components";
import { EASING } from "./_utils";
import { fillExpand } from "./_styled-shared";

export const BudgetCard = styled.div<{ $exceeded: boolean }>`
  background: var(--surface);
  border: 1px solid
    ${(p) =>
      p.$exceeded ? "rgba(239, 68, 68, 0.3)" : "var(--border)"};
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transition: all 0.3s ${EASING};

  &:hover {
    border-color: ${(p) =>
      p.$exceeded
        ? "rgba(239, 68, 68, 0.5)"
        : "rgba(59, 130, 246, 0.3)"};
    transform: translateY(-2px);
    box-shadow: 0 8px 32px
      ${(p) =>
        p.$exceeded
          ? "rgba(239, 68, 68, 0.08)"
          : "rgba(59, 130, 246, 0.08)"};
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const CategoryName = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
`;

export const ExceededBadge = styled.span`
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border-radius: 6px;
`;

export const CardActions = styled.div`
  display: flex;
  gap: 2px;
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

export const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: var(--surface-hover);
  overflow: hidden;
  margin-bottom: 12px;
`;

export const ProgressFill = styled.div<{ $width: number; $exceeded: boolean }>`
  height: 100%;
  border-radius: 6px;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: ${(p) =>
    p.$exceeded
      ? "var(--danger)"
      : "linear-gradient(90deg, var(--accent), #22d3ee)"};
  transition: width 1s ${EASING};
  animation: ${fillExpand} 0.8s ${EASING};
`;

export const AmountRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

export const SpentAmount = styled.span<{ $exceeded: boolean }>`
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => (p.$exceeded ? "var(--danger)" : "var(--text)")};
`;

export const LimitAmount = styled.span`
  font-size: 13px;
  color: var(--text-muted);
`;

export const RemainingText = styled.p<{ $exceeded: boolean }>`
  font-size: 12px;
  color: ${(p) => (p.$exceeded ? "var(--danger)" : "var(--text-dim)")};
  margin: 4px 0 0 0;
`;

export const ConfirmBody = styled.div`
  text-align: center;
`;

export const ConfirmText = styled.p`
  font-size: 14px;
  color: var(--text-dim);
  margin: 0 0 24px 0;
  line-height: 1.6;
`;

export const ConfirmActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;

export const ConfirmButton = styled.button<{ $variant: "danger" | "cancel" }>`
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  background: ${(p) =>
    p.$variant === "danger" ? "var(--danger)" : "var(--surface)"};
  color: ${(p) => (p.$variant === "danger" ? "#fff" : "var(--text)")};
  border: 1px solid
    ${(p) => (p.$variant === "danger" ? "var(--danger)" : "var(--border)")};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;
