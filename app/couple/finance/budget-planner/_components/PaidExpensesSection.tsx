"use client";

import styled from "styled-components";
import {
  SectionCard,
  SectionTitle,
  LineItemGrid,
  LineItemRow,
  LineItemField,
  FinanceSelect,
  FinanceInput,
  UndoButton,
  TotalRow,
} from "../_styled";
import { formatCurrency, type LineItem } from "../_utils";

const PaidSectionCard = styled(SectionCard)`
  border-left: 4px solid #22c55e;
`;

const PaidAmount = styled.span`
  color: #22c55e;
`;

type Props = {
  lineItems: LineItem[];
  totalPaid: number;
  onUndoPaid: (index: number) => void;
};

export default function PaidExpensesSection({
  lineItems,
  totalPaid,
  onUndoPaid,
}: Props) {
  return (
    <PaidSectionCard>
      <SectionTitle>Paid Expenses</SectionTitle>
      <LineItemGrid>
        {lineItems.map((item, index) =>
          item.paid ? (
            <LineItemRow key={item.id} $paid>
              <LineItemField $flex={1.2}>
                <FinanceSelect value={item.category} disabled onChange={() => {}}>
                  <option value={item.category}>{item.category}</option>
                </FinanceSelect>
              </LineItemField>
              <LineItemField>
                <FinanceInput
                  type="number"
                  value={item.amount || ""}
                  disabled
                  readOnly
                />
              </LineItemField>
              <LineItemField>
                <FinanceInput
                  type="text"
                  value={item.note || ""}
                  disabled
                  readOnly
                />
              </LineItemField>
              <UndoButton onClick={() => onUndoPaid(index)} title="Undo paid">
                ↩ Undo
              </UndoButton>
            </LineItemRow>
          ) : null
        )}
      </LineItemGrid>
      <TotalRow>
        <span>Total Paid Expenses</span>
        <PaidAmount>{formatCurrency(totalPaid)}</PaidAmount>
      </TotalRow>
    </PaidSectionCard>
  );
}
