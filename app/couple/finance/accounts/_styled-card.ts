"use client";

/**
 * Styled atoms for the account list cards on the accounts list page.
 *
 * Groups the card grid, account card surface, header, icon, info, badges,
 * meta rows, chevron, and quick-action buttons. Imported through `_styled.ts`
 * for consistency.
 */

import styled, { keyframes } from "styled-components";
import { EASING } from "./_utils";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  animation: ${fadeIn} 0.3s ${EASING};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const AccountCard = styled.div`
  position: relative;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ${EASING};
  cursor: pointer;

  &:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
  }
`;

export const CardHeader = styled.div`
  padding: 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;

  @media (max-width: 480px) {
    padding: 16px;
  }
`;

export const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
`;

export const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 28px;
`;

export const CardNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

export const CardName = styled.div`
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

export const CardType = styled.div`
  font-size: 11px;
  letter-spacing: 0.2px;
  color: var(--text-muted);
  text-transform: uppercase;
  opacity: 0.85;
`;

export const CardBalance = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  margin-top: 2px;
`;

export const CardMetaRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
`;

export const CardMetaLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

export const CardChevron = styled.div`
  color: var(--text-muted);
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.55;
`;

export const CardActions = styled.div`
  padding: 0 20px 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const CardActionBtn = styled.button`
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  &:hover {
    border-color: var(--accent);
    color: var(--accent);
  }
`;
