"use client";

import styled, { css } from "styled-components";
import { EASING } from "./_utils";
import { sparkle, ringDraw } from "./_styled-shared";

export const GoalCard = styled.div<{ $nearComplete: boolean }>`
  background: var(--surface);
  border: 1px solid
    ${(p) =>
      p.$nearComplete ? "rgba(34, 197, 94, 0.35)" : "var(--border)"};
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transition: all 0.3s ${EASING};

  ${(p) =>
    p.$nearComplete &&
    css`
      animation: ${sparkle} 3s ease-in-out infinite;
    `}

  &:hover {
    border-color: ${(p) =>
      p.$nearComplete
        ? "rgba(34, 197, 94, 0.5)"
        : "rgba(59, 130, 246, 0.3)"};
    transform: translateY(-2px);
    box-shadow: 0 8px 32px
      ${(p) =>
        p.$nearComplete
          ? "rgba(34, 197, 94, 0.1)"
          : "rgba(59, 130, 246, 0.08)"};
  }
`;

export const GoalCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export const GoalName = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
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

export const RingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
`;

export const RingSvg = styled.svg`
  width: 120px;
  height: 120px;
  transform: rotate(-90deg);
`;

export const RingTrack = styled.circle`
  fill: none;
  stroke: var(--surface-hover);
  stroke-width: 8;
`;

export const RingFill = styled.circle<{
  $dashoffset: number;
  $circumference: number;
  $gradientId?: string;
}>`
  fill: none;
  stroke: ${(p) =>
    p.$gradientId ? `url(#${p.$gradientId})` : "url(#goalGradient)"};
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: ${(p) => p.$circumference};
  stroke-dashoffset: ${(p) => p.$dashoffset};
  transition: stroke-dashoffset 1s ${EASING};
  --ring-circumference: ${(p) => p.$circumference};
  animation: ${ringDraw} 1s ${EASING};
`;

export const RingCenter = styled.div`
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const RingPct = styled.span`
  font-size: 24px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -1px;
`;

export const RingLabel = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const RingWrapper = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const AmountRow = styled.div`
  text-align: center;
  margin-bottom: 8px;
`;

export const CurrentAmount = styled.span`
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
`;

export const TargetAmount = styled.span`
  font-size: 14px;
  color: var(--text-muted);
`;

export const RemainingText = styled.p`
  font-size: 12px;
  color: var(--text-dim);
  text-align: center;
  margin: 0 0 12px 0;
`;

export const DeadlineBadge = styled.span<{ $overdue: boolean }>`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  margin-bottom: 16px;

  background: ${(p) =>
    p.$overdue
      ? "rgba(239, 68, 68, 0.12)"
      : "rgba(59, 130, 246, 0.1)"};
  color: ${(p) =>
    p.$overdue ? "var(--danger)" : "var(--accent-light)"};
  border: 1px solid
    ${(p) =>
      p.$overdue
        ? "rgba(239, 68, 68, 0.25)"
        : "rgba(59, 130, 246, 0.2)"};
`;

export const DeadlineRow = styled.div`
  text-align: center;
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
`;

export const SmallButton = styled.button<{
  $variant?: "primary" | "outline" | "accent";
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
        ? "rgba(34, 197, 94, 0.1)"
        : "transparent"};
  color: ${(p) =>
    p.$variant === "primary"
      ? "#fff"
      : p.$variant === "accent"
        ? "var(--success)"
        : "var(--text-dim)"};
  border-color: ${(p) =>
    p.$variant === "primary"
      ? "var(--accent)"
      : p.$variant === "accent"
        ? "rgba(34, 197, 94, 0.3)"
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
