"use client";

import styled from "styled-components";
import { EASING } from "./_utils";
import { fadeIn } from "./_styled-shared";

export const ContributeWrapper = styled.div`
  padding: 24px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

export const ContributeProgress = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.04);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px;
`;

export const ContributeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  & + & {
    margin-top: 8px;
  }
`;

export const ContributeLabel = styled.span`
  font-size: 13px;
  color: var(--text-dim);
`;

export const ContributeValue = styled.span<{ $color?: string }>`
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.$color ?? "var(--text)"};
`;

export const ContributeTrack = styled.div`
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: var(--surface-hover);
  overflow: hidden;
  margin-top: 12px;
`;

export const ContributeFill = styled.div<{ $width: number }>`
  height: 100%;
  border-radius: 6px;
  width: ${(p) => Math.min(p.$width, 100)}%;
  background: linear-gradient(90deg, var(--accent), #22d3ee);
  transition: width 0.5s ${EASING};
`;

export const NewProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
`;

export const NewPctText = styled.span<{ $color?: string }>`
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.$color ?? "var(--text-muted)"};
`;

export const DarkInput = styled.input`
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 14px;
  font-family: inherit;
  margin-bottom: 16px;
  transition: border-color 0.2s ${EASING};

  &:focus {
    outline: none;
    border-color: var(--accent);
  }

  &::placeholder {
    color: var(--text-muted);
  }
`;

export const ContributeActions = styled.div`
  display: flex;
  gap: 12px;
`;

export const ContributeButton = styled.button<{
  $variant: "primary" | "cancel";
}>`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};
  border: 1px solid;

  background: ${(p) =>
    p.$variant === "primary" ? "var(--success)" : "transparent"};
  color: ${(p) =>
    p.$variant === "primary" ? "#fff" : "var(--text)"};
  border-color: ${(p) =>
    p.$variant === "primary" ? "var(--success)" : "var(--border)"};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
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
