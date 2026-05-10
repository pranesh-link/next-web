"use client";

import {
  SummaryRow,
  SummaryCardStyled,
  SummaryLabel,
  SummaryValue,
} from "../_styled";
import { formatCurrency } from "../_utils";

type Props = {
  totalGoals: number;
  totalSaved: number;
  totalTarget: number;
};

export default function GoalsSummarySection({
  totalGoals,
  totalSaved,
  totalTarget,
}: Props) {
  return (
    <SummaryRow>
      <SummaryCardStyled>
        <SummaryLabel>Total Goals</SummaryLabel>
        <SummaryValue>{totalGoals}</SummaryValue>
      </SummaryCardStyled>
      <SummaryCardStyled>
        <SummaryLabel>Total Saved</SummaryLabel>
        <SummaryValue $color="var(--success)">
          {formatCurrency(totalSaved)}
        </SummaryValue>
      </SummaryCardStyled>
      <SummaryCardStyled>
        <SummaryLabel>Total Target</SummaryLabel>
        <SummaryValue $color="var(--accent-light)">
          {formatCurrency(totalTarget)}
        </SummaryValue>
      </SummaryCardStyled>
    </SummaryRow>
  );
}
