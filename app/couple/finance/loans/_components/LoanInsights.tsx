"use client";

import styled from "styled-components";
import { EASING, formatCurrency, type InsightResult } from "../_utils";
import { fadeIn, InsightRow, InsightLabel, InsightValue } from "../_styled";

const InsightsPanel = styled.div`
  margin-top: 16px;
  padding: 16px;
  background: rgba(245, 158, 11, 0.04);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 12px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

const InsightsTitle = styled.h4`
  font-size: 13px;
  font-weight: 700;
  color: var(--warning);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ScenarioTable = styled.div`
  margin-top: 12px;
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 8px;
  overflow: hidden;
`;

const ScenarioRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  padding: 7px 10px;
  font-size: 12px;
  border-bottom: 1px solid rgba(245, 158, 11, 0.08);
  min-width: 0;

  &:last-child { border-bottom: none; }
  &:first-child {
    background: rgba(245, 158, 11, 0.06);
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--warning);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }
`;

const ScenarioCell = styled.span<{ $color?: string }>`
  color: ${(p) => p.$color ?? "var(--text-dim)"};
  font-variant-numeric: tabular-nums;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ScenariosHeaderRow = styled(InsightRow)`
  margin-top: 12px;
`;

const ScenariosHeaderLabel = styled(InsightLabel)`
  font-weight: 700;
  color: var(--warning);
`;

type Props = {
  loading: boolean;
  data: InsightResult | null;
};

export default function LoanInsights({ loading, data }: Props) {
  return (
    <InsightsPanel>
      <InsightsTitle>Loan Insights</InsightsTitle>
      {loading ? (
        <InsightRow>
          <InsightLabel>Loading…</InsightLabel>
        </InsightRow>
      ) : data ? (
        <>
          <InsightRow>
            <InsightLabel>Total Interest Payable</InsightLabel>
            <InsightValue $color="var(--danger)">
              {formatCurrency(data.totalInterestPayable)}
            </InsightValue>
          </InsightRow>
          <InsightRow>
            <InsightLabel>Months Remaining</InsightLabel>
            <InsightValue>
              {data.monthsRemaining === Infinity ? "∞" : data.monthsRemaining}
            </InsightValue>
          </InsightRow>
          {data.prepaymentAmount != null && data.earlyPayoffSavings != null && (
            <InsightRow>
              <InsightLabel>
                Pay 1 extra EMI ({formatCurrency(data.prepaymentAmount)})
              </InsightLabel>
              <InsightValue $color="var(--success)">
                Save {formatCurrency(data.earlyPayoffSavings)}
              </InsightValue>
            </InsightRow>
          )}
          {data.scenarios && data.scenarios.length > 0 && (
            <>
              <ScenariosHeaderRow>
                <ScenariosHeaderLabel>
                  Early Closure Scenarios
                </ScenariosHeaderLabel>
              </ScenariosHeaderRow>
              <ScenarioTable>
                <ScenarioRow>
                  <ScenarioCell>Extra/mo</ScenarioCell>
                  <ScenarioCell>New EMI</ScenarioCell>
                  <ScenarioCell>Closes</ScenarioCell>
                  <ScenarioCell>Saves</ScenarioCell>
                </ScenarioRow>
                {data.scenarios.map((s) => (
                  <ScenarioRow key={s.extraMonthlyAmount}>
                    <ScenarioCell $color="var(--accent-light)">
                      +{formatCurrency(s.extraMonthlyAmount)}
                    </ScenarioCell>
                    <ScenarioCell>{formatCurrency(s.newTotalEMI)}</ScenarioCell>
                    <ScenarioCell $color="var(--text)">
                      {s.closureDate}
                    </ScenarioCell>
                    <ScenarioCell $color="var(--success)">
                      {formatCurrency(s.interestSaved)}
                    </ScenarioCell>
                  </ScenarioRow>
                ))}
              </ScenarioTable>
            </>
          )}
        </>
      ) : null}
    </InsightsPanel>
  );
}
