"use client";

import { useState } from "react";
import styled from "styled-components";
import { EASING, formatCurrency, type ScheduleEntry } from "../_utils";
import {
  InsightLabel,
  InsightRow,
  ScheduleTable,
  ScheduleTableWrapper,
  ScheduleTd,
  ScheduleTh,
  SchedulePanel,
  SummaryLabel,
  SummaryValue,
} from "../_styled";

const AccordionSection = styled.div`
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;

  & + & {
    margin-top: 12px;
  }
`;

const AccordionHeader = styled.button<{ $open: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${(p) => (p.$open ? "rgba(59, 130, 246, 0.06)" : "var(--surface)")};
  border: none;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ${EASING};

  &:hover {
    background: rgba(59, 130, 246, 0.08);
  }
`;

const AccordionTitle = styled.span<{ $color?: string }>`
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${(p) => p.$color ?? "var(--text)"};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AccordionBadge = styled.span<{ $color?: string }>`
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${(p) => p.$color ?? "rgba(59, 130, 246, 0.15)"};
  color: ${(p) => (p.$color === "rgba(34, 197, 94, 0.15)" ? "var(--success)" : "var(--accent-light)")};
`;

const AccordionChevron = styled.span<{ $open: boolean }>`
  font-size: 12px;
  color: var(--text-muted);
  transition: transform 0.2s ${EASING};
  transform: rotate(${(p) => (p.$open ? "180deg" : "0deg")});
`;

const AccordionBody = styled.div<{ $open: boolean }>`
  display: ${(p) => (p.$open ? "block" : "none")};
`;

const TotalsGrid = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const TotalCard = styled.div`
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
`;

const TotalLabel = styled(SummaryLabel)`
  font-size: 10px;
  margin-bottom: 6px;
`;

const TotalValue = styled(SummaryValue)`
  font-size: 15px;
  letter-spacing: -0.5px;
`;

type Props = {
  loading: boolean;
  scheduleData: ScheduleEntry[] | null;
};

function renderTable(entries: ScheduleEntry[]) {
  return (
    <ScheduleTableWrapper>
      <ScheduleTable>
        <thead>
          <tr>
            <ScheduleTh>#</ScheduleTh>
            <ScheduleTh>Date</ScheduleTh>
            <ScheduleTh $align="right">EMI</ScheduleTh>
            <ScheduleTh $align="right">Principal</ScheduleTh>
            <ScheduleTh $align="right">Interest</ScheduleTh>
            <ScheduleTh $align="right">Balance</ScheduleTh>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.month}>
              <ScheduleTd>{entry.month}</ScheduleTd>
              <ScheduleTd>
                {new Date(entry.date).toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })}
              </ScheduleTd>
              <ScheduleTd $align="right">{formatCurrency(entry.emi)}</ScheduleTd>
              <ScheduleTd $align="right" $color="var(--success)">
                {formatCurrency(entry.principal)}
              </ScheduleTd>
              <ScheduleTd $align="right" $color="var(--danger)">
                {formatCurrency(entry.interest)}
              </ScheduleTd>
              <ScheduleTd $align="right">{formatCurrency(entry.balance)}</ScheduleTd>
            </tr>
          ))}
        </tbody>
      </ScheduleTable>
    </ScheduleTableWrapper>
  );
}

export default function ScheduleModalBody({ loading, scheduleData }: Props) {
  const [pendingOpen, setPendingOpen] = useState(true);
  const [paidOpen, setPaidOpen] = useState(false);

  if (loading) {
    return (
      <SchedulePanel>
        <InsightRow>
          <InsightLabel>Loading schedule…</InsightLabel>
        </InsightRow>
      </SchedulePanel>
    );
  }

  if (!scheduleData || scheduleData.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const paidEntries = scheduleData.filter((e) => new Date(e.date) <= today);
  const pendingEntries = scheduleData.filter((e) => new Date(e.date) > today);

  return (
    <div>
      {pendingEntries.length > 0 && (
        <AccordionSection>
          <AccordionHeader
            $open={pendingOpen}
            onClick={() => setPendingOpen((o) => !o)}
          >
            <AccordionTitle $color="var(--warning)">
              Pending Dues
              <AccordionBadge>{pendingEntries.length}</AccordionBadge>
            </AccordionTitle>
            <AccordionChevron $open={pendingOpen}>▼</AccordionChevron>
          </AccordionHeader>
          <AccordionBody $open={pendingOpen}>
            {renderTable(pendingEntries)}
          </AccordionBody>
        </AccordionSection>
      )}

      {paidEntries.length > 0 && (
        <AccordionSection>
          <AccordionHeader
            $open={paidOpen}
            onClick={() => setPaidOpen((o) => !o)}
          >
            <AccordionTitle $color="var(--success)">
              Paid
              <AccordionBadge $color="rgba(34, 197, 94, 0.15)">
                {paidEntries.length}
              </AccordionBadge>
            </AccordionTitle>
            <AccordionChevron $open={paidOpen}>▼</AccordionChevron>
          </AccordionHeader>
          <AccordionBody $open={paidOpen}>
            {renderTable(paidEntries)}
          </AccordionBody>
        </AccordionSection>
      )}

      <TotalsGrid>
        {[
          {
            label: "Total Payable",
            value: scheduleData.reduce((s, e) => s + e.emi, 0),
            color: "var(--text)",
          },
          {
            label: "Principal",
            value: scheduleData.reduce((s, e) => s + (e.principal || 0), 0),
            color: "var(--success)",
          },
          {
            label: "Interest",
            value: scheduleData.reduce((s, e) => s + (e.interest || 0), 0),
            color: "var(--danger)",
          },
        ].map(({ label, value, color }) => (
          <TotalCard key={label}>
            <TotalLabel>{label}</TotalLabel>
            <TotalValue $color={color}>{formatCurrency(value)}</TotalValue>
          </TotalCard>
        ))}
      </TotalsGrid>
    </div>
  );
}
