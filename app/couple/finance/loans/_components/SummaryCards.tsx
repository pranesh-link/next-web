"use client";

import styled from "styled-components";
import { EASING, formatCurrency } from "../_utils";
import { SummaryLabel, SummaryValue } from "../_styled";

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCardStyled = styled.div`
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

type Props = {
  totalLoans: number;
  totalOutstanding: number;
  monthlyEmiLoad: number;
};

export default function SummaryCards({
  totalLoans,
  totalOutstanding,
  monthlyEmiLoad,
}: Props) {
  return (
    <SummaryRow>
      <SummaryCardStyled>
        <SummaryLabel>Total Loans</SummaryLabel>
        <SummaryValue>{totalLoans}</SummaryValue>
      </SummaryCardStyled>
      <SummaryCardStyled>
        <SummaryLabel>Total Outstanding</SummaryLabel>
        <SummaryValue $color="var(--warning)">
          {formatCurrency(totalOutstanding)}
        </SummaryValue>
      </SummaryCardStyled>
      <SummaryCardStyled>
        <SummaryLabel>Monthly EMI Load</SummaryLabel>
        <SummaryValue $color="var(--danger)">
          {formatCurrency(monthlyEmiLoad)}
        </SummaryValue>
      </SummaryCardStyled>
    </SummaryRow>
  );
}
