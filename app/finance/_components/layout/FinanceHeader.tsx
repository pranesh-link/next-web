"use client";

import { useState, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";

interface FinanceHeaderProps {
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onRefresh?: () => Promise<void>;
}

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const RefreshButton = styled.button<{ $spinning: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  color: var(--text-muted);
  flex-shrink: 0;
  transition: all 0.25s ${EASING};

  &:hover {
    color: var(--accent);
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 8%, transparent);
  }

  &:active {
    transform: scale(0.92);
  }

  svg {
    width: 18px;
    height: 18px;
    ${({ $spinning }) =>
      $spinning &&
      css`
        animation: ${spin} 0.8s linear infinite;
      `}
  }
`;

const HeaderWrapper = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--bg-elevated);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  padding: 20px 32px;
  transition: all 0.3s ${EASING};

  @media (max-width: 768px) {
    /* left: 16px gap + 48px hamburger + 12px gap = 76px */
    padding: 0 16px 0 76px;
    height: 64px;
  }
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
  margin: 0;
  /* truncate long titles in header */
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--accent);
  color: #ffffff;
  border: none;
  border-radius: 24px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.25s ${EASING};

  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 480px) {
    padding: 10px;
    border-radius: 50%;

    span {
      display: none;
    }
  }
`;

export default function FinanceHeader({
  title,
  action,
  onRefresh,
}: FinanceHeaderProps) {
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || spinning) return;
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      setSpinning(false);
    }
  }, [onRefresh, spinning]);

  return (
    <HeaderWrapper>
      <Title>{title}</Title>
      {onRefresh && (
        <RefreshButton
          type="button"
          onClick={handleRefresh}
          $spinning={spinning}
          aria-label="Refresh data"
          disabled={spinning}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </RefreshButton>
      )}
      {action && (
        <ActionButton type="button" onClick={action.onClick}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{action.label}</span>
        </ActionButton>
      )}
    </HeaderWrapper>
  );
}
