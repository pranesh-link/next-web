"use client";

import { formatCurrency, type Loan, type Prepayment } from "../_utils";
import {
  InsightLabel,
  ScheduleTable,
  ScheduleTableWrapper,
  ScheduleTd,
  ScheduleTh,
} from "../_styled";
import {
  AddPrepaymentButton,
  AddPrepaymentRow,
  AddPrepaymentSection,
  AddPrepaymentTitle,
  EmptyPanel,
  FieldGroup,
  FieldLabel,
  FullWidthInput,
  LockedMarker,
  RemovePrepaymentButton,
  SourceBadge,
} from "./PrepaymentsModalBody.styled";

type Props = {
  loan: Loan | undefined;
  ppDate: string;
  ppAmount: string;
  ppSubmitting: boolean;
  onPpDateChange: (v: string) => void;
  onPpAmountChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export default function PrepaymentsModalBody({
  loan,
  ppDate,
  ppAmount,
  ppSubmitting,
  onPpDateChange,
  onPpAmountChange,
  onAdd,
  onRemove,
}: Props) {
  const ppList: Prepayment[] =
    loan?.prepayments && Array.isArray(loan.prepayments)
      ? loan.prepayments
          .slice()
          .sort(
            (a, b) =>
              new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
      : [];
  const loanStart = loan
    ? new Date(loan.startDate).toISOString().split("T")[0]
    : "";
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <>
      {/* Add Prepayment Form */}
      <AddPrepaymentSection>
        <AddPrepaymentTitle>Add Prepayment</AddPrepaymentTitle>
        <AddPrepaymentRow>
          <FieldGroup $minBasis="140px">
            <FieldLabel>Date</FieldLabel>
            <FullWidthInput
              type="date"
              value={ppDate}
              min={loanStart}
              max={todayStr}
              onChange={(e) => onPpDateChange(e.target.value)}
            />
          </FieldGroup>
          <FieldGroup $minBasis="120px">
            <FieldLabel>Amount (₹)</FieldLabel>
            <FullWidthInput
              type="number"
              min="1"
              placeholder="e.g. 50000"
              value={ppAmount}
              onChange={(e) => onPpAmountChange(e.target.value)}
            />
          </FieldGroup>
          <AddPrepaymentButton
            $variant="primary"
            onClick={onAdd}
            disabled={ppSubmitting || !ppDate || !ppAmount}
          >
            {ppSubmitting ? "Adding…" : "+ Add"}
          </AddPrepaymentButton>
        </AddPrepaymentRow>
      </AddPrepaymentSection>

      {/* Prepayment List */}
      {ppList.length > 0 ? (
        <ScheduleTableWrapper>
          <ScheduleTable>
            <thead>
              <tr>
                <ScheduleTh>#</ScheduleTh>
                <ScheduleTh>Date</ScheduleTh>
                <ScheduleTh $align="right">Amount</ScheduleTh>
                <ScheduleTh $align="right">Balance After</ScheduleTh>
                <ScheduleTh>Source</ScheduleTh>
                <ScheduleTh $align="center">Action</ScheduleTh>
              </tr>
            </thead>
            <tbody>
              {ppList.map((pp, i) => {
                const isScanned = !pp.source || pp.source === "scanned";
                return (
                  <tr key={i}>
                    <ScheduleTd>{i + 1}</ScheduleTd>
                    <ScheduleTd>
                      {new Date(pp.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </ScheduleTd>
                    <ScheduleTd $align="right" $color="var(--success)">
                      {formatCurrency(pp.amount)}
                    </ScheduleTd>
                    <ScheduleTd $align="right">
                      {pp.balanceAfter != null
                        ? formatCurrency(pp.balanceAfter)
                        : "—"}
                    </ScheduleTd>
                    <ScheduleTd>
                      <SourceBadge $scanned={isScanned}>
                        {isScanned ? "🔖 Statement" : "✏️ Manual"}
                      </SourceBadge>
                    </ScheduleTd>
                    <ScheduleTd $align="center">
                      {isScanned ? (
                        <LockedMarker title="Extracted from loan statement — cannot remove">
                          🔒
                        </LockedMarker>
                      ) : (
                        <RemovePrepaymentButton
                          title="Remove prepayment"
                          onClick={() => onRemove(i)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                          </svg>
                        </RemovePrepaymentButton>
                      )}
                    </ScheduleTd>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <ScheduleTd colSpan={2}>
                  <strong>Total Prepaid</strong>
                </ScheduleTd>
                <ScheduleTd $align="right" $color="var(--success)">
                  <strong>
                    {formatCurrency(
                      ppList.reduce((s, p) => s + p.amount, 0),
                    )}
                  </strong>
                </ScheduleTd>
                <ScheduleTd colSpan={3} />
              </tr>
            </tfoot>
          </ScheduleTable>
        </ScheduleTableWrapper>
      ) : (
        <EmptyPanel>
          <InsightLabel>
            No prepayments recorded. Use the form above to add one.
          </InsightLabel>
        </EmptyPanel>
      )}
    </>
  );
}
