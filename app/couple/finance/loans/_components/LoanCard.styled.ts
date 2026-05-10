"use client";

import styled from "styled-components";
import { EASING } from "../_utils";
import { fillExpand } from "../_styled";

export const LoanCardWrap = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  transition: all 0.3s ${EASING};

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
  }
`;

export const LoanCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export const LoanName = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: "";
    display: block;
    width: 4px;
    height: 20px;
    border-radius: 2px;
    background: var(--accent);
    flex-shrink: 0;
  }
`;

export const CardActions = styled.div`
  display: flex;
  gap: 2px;
`;

export const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
`;

export const DetailItem = styled.div``;

export const DetailLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
  margin: 0 0 4px 0;
`;

export const DetailValue = styled.p<{ $color?: string }>`
  font-size: 16px;
  font-weight: 700;
  color: ${(p) => p.$color ?? "var(--text)"};
  margin: 0;
`;

export const EmiTooltip = styled.span`
  margin-left: 6px;
  cursor: pointer;
  font-size: 14px;
  position: relative;
  display: inline-block;
`;

export const EmiTooltipBubble = styled.span`
  position: absolute;
  top: 50%;
  left: calc(100% + 8px);
  transform: translateY(-50%);
  width: 220px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--bg-elevated, #1e1e2e);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 12px;
  line-height: 1.4;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  z-index: 10;
  pointer-events: auto;
  white-space: normal;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 100%;
    transform: translateY(-50%);
    border: 6px solid transparent;
    border-right-color: var(--border);
  }
`;

export const ProgressSection = styled.div`
  margin-bottom: 16px;
`;

export const ProgressMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const ProgressLabel = styled.span`
  font-size: 12px;
  color: var(--text-dim);
`;

export const ProgressPct = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--accent);
`;

export const ProgressTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: var(--surface-hover);
  overflow: hidden;
`;

export const ProgressFill = styled.div<{ $width: number }>`
  height: 100%;
  border-radius: 6px;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: linear-gradient(90deg, var(--accent), #22d3ee);
  transition: width 1s ${EASING};
  animation: ${fillExpand} 0.8s ${EASING};
`;

export const RemainingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
`;

export const RemainingLabel = styled.span`
  font-size: 12px;
  color: var(--text-dim);
`;

export const RemainingValue = styled.span`
  font-size: 18px;
  font-weight: 700;
  color: var(--warning);
`;

export const StartDate = styled.p`
  font-size: 12px;
  color: var(--text-dim);
  margin: 0 0 4px 0;
`;

export const ScheduleSourceNote = styled.p<{ $accent?: boolean }>`
  font-size: 11px;
  color: ${(p) => (p.$accent ? "var(--accent)" : "var(--text)")};
  font-style: italic;
  margin: 0 0 16px 0;
  padding: 5px 8px;
  background: rgba(59, 130, 246, 0.1);
  border-left: 2px solid
    ${(p) =>
      p.$accent
        ? "rgba(var(--accent-rgb, 99, 102, 241), 0.3)"
        : "rgba(59, 130, 246, 0.4)"};
  border-radius: 0 4px 4px 0;
`;

export const AccountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent-light);
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.18);
  border-radius: 5px;
  padding: 2px 7px;
  letter-spacing: 0.3px;
`;

export const LoanMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
  margin-top: -10px;
`;

export const LoanProviderText = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.2px;
`;

export const CardMetaRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
  gap: 12px;
`;

export const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const MetaLabel = styled.span`
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-dim);
`;

export const MetaValue = styled.span<{ $urgent?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => (p.$urgent ? "#ef4444" : "var(--text)")};
`;
