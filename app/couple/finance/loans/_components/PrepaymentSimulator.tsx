"use client";

import styled from "styled-components";
import { EASING, formatCurrency, type PrepaymentResult } from "../_utils";
import { fadeIn } from "../_styled";
import { DarkInput, SmallButton } from "../_styled";

const SimulatorWrapper = styled.div`
  margin-top: 16px;
  padding: 20px;
  background: rgba(59, 130, 246, 0.04);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 12px;
  animation: ${fadeIn} 0.3s ${EASING};
`;

const SimulatorTitle = styled.h4`
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-light);
  margin: 0 0 16px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SimInputRow = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
`;

const ComparisonGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: stretch;
`;

const ComparisonColumn = styled.div<{ $side: "before" | "after" }>`
  padding: 16px;
  border-radius: ${(p) =>
    p.$side === "before" ? "10px 0 0 10px" : "0 10px 10px 0"};
  background: ${(p) =>
    p.$side === "before"
      ? "rgba(255, 255, 255, 0.03)"
      : "rgba(34, 197, 94, 0.05)"};
  border: 1px solid
    ${(p) =>
      p.$side === "before"
        ? "var(--border)"
        : "rgba(34, 197, 94, 0.2)"};
`;

const ComparisonDivider = styled.div`
  width: 1px;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &::after {
    content: "→";
    position: absolute;
    background: var(--surface);
    color: var(--text-muted);
    font-size: 12px;
    padding: 4px;
    border-radius: 4px;
  }
`;

const CompColTitle = styled.p`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  margin: 0 0 12px 0;
`;

const CompItem = styled.div`
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CompItemLabel = styled.p`
  font-size: 11px;
  color: var(--text-muted);
  margin: 0 0 2px 0;
`;

const CompItemValue = styled.p<{ $color?: string }>`
  font-size: 15px;
  font-weight: 700;
  color: ${(p) => p.$color ?? "var(--text)"};
  margin: 0;
`;

const SavedBanner = styled.div`
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SavedLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--success);
`;

const SavedValue = styled.span`
  font-size: 18px;
  font-weight: 800;
  color: var(--success);
`;

const MonthsSavedBanner = styled(SavedBanner)`
  margin-top: 8px;
`;

type Props = {
  prepaymentAmount: string;
  onPrepaymentAmountChange: (v: string) => void;
  simulating: boolean;
  onSimulate: () => void;
  simResult: PrepaymentResult | null;
};

export default function PrepaymentSimulator({
  prepaymentAmount,
  onPrepaymentAmountChange,
  simulating,
  onSimulate,
  simResult,
}: Props) {
  return (
    <SimulatorWrapper>
      <SimulatorTitle>Prepayment Simulator</SimulatorTitle>
      <SimInputRow>
        <DarkInput
          type="number"
          min="1"
          placeholder="Enter prepayment amount"
          value={prepaymentAmount}
          onChange={(e) => onPrepaymentAmountChange(e.target.value)}
        />
        <SmallButton
          $variant="primary"
          onClick={onSimulate}
          disabled={simulating || !prepaymentAmount}
        >
          {simulating ? "…" : "Simulate"}
        </SmallButton>
      </SimInputRow>

      {simResult && (
        <>
          <ComparisonGrid>
            <ComparisonColumn $side="before">
              <CompColTitle>Before</CompColTitle>
              <CompItem>
                <CompItemLabel>Total Interest</CompItemLabel>
                <CompItemValue>
                  {formatCurrency(simResult.originalInterest)}
                </CompItemValue>
              </CompItem>
              <CompItem>
                <CompItemLabel>Tenure</CompItemLabel>
                <CompItemValue>{simResult.originalTenure} mo</CompItemValue>
              </CompItem>
            </ComparisonColumn>

            <ComparisonDivider />

            <ComparisonColumn $side="after">
              <CompColTitle>After</CompColTitle>
              <CompItem>
                <CompItemLabel>Total Interest</CompItemLabel>
                <CompItemValue $color="var(--success)">
                  {formatCurrency(simResult.newInterest)}
                </CompItemValue>
              </CompItem>
              <CompItem>
                <CompItemLabel>Tenure</CompItemLabel>
                <CompItemValue $color="var(--success)">
                  {simResult.newTenure} mo
                </CompItemValue>
              </CompItem>
            </ComparisonColumn>
          </ComparisonGrid>

          <SavedBanner>
            <SavedLabel>Interest Saved</SavedLabel>
            <SavedValue>{formatCurrency(simResult.interestSaved)}</SavedValue>
          </SavedBanner>

          {simResult.originalTenure - simResult.newTenure > 0 && (
            <MonthsSavedBanner>
              <SavedLabel>Months Saved</SavedLabel>
              <SavedValue>
                {simResult.originalTenure - simResult.newTenure} months
              </SavedValue>
            </MonthsSavedBanner>
          )}
        </>
      )}
    </SimulatorWrapper>
  );
}
