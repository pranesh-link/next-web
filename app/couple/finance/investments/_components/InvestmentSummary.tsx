"use client";

import {
  SummaryCard,
  SummaryGrid,
  SummaryLabel,
  SummaryValue,
} from "../_styled";
import { formatCurrency } from "../_utils";

type Props = {
  invested: number;
  current: number;
  gainLoss: number;
};

export default function InvestmentSummary({ invested, current, gainLoss }: Props) {
  return (
    <SummaryGrid>
      <SummaryCard>
        <SummaryLabel>Total Invested</SummaryLabel>
        <SummaryValue>{formatCurrency(invested)}</SummaryValue>
      </SummaryCard>
      <SummaryCard>
        <SummaryLabel>Current Value</SummaryLabel>
        <SummaryValue>{formatCurrency(current)}</SummaryValue>
      </SummaryCard>
      <SummaryCard>
        <SummaryLabel>Gain/Loss</SummaryLabel>
        <SummaryValue $danger={gainLoss < 0}>
          {formatCurrency(gainLoss)}
        </SummaryValue>
      </SummaryCard>
    </SummaryGrid>
  );
}
