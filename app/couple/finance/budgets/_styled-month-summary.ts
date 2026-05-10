"use client";

import styled from "styled-components";
import { EASING } from "./_utils";

export const MonthSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
  flex-wrap: wrap;
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

export const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ${EASING};

  &:hover {
    border-color: rgba(59, 130, 246, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(59, 130, 246, 0.08);
  }
`;

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
