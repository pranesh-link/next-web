"use client";

import {
  SectionCard,
  SectionTitle,
  LineItemGrid,
  LineItemRow,
  LineItemField,
  FinanceSelect,
  FinanceInput,
  MarkPaidButton,
  RemoveButton,
  ExpenseActions,
  AddButton,
  TotalRow,
} from "../_styled";
import { CATEGORIES, formatCurrency, type LineItem } from "../_utils";

type Props = {
  mode: "monthly" | "yearly";
  lineItems: LineItem[];
  totalExpenses: number;
  prevPlanHasItems: boolean;
  onUpdate: (index: number, field: keyof LineItem, value: string | number) => void;
  onMarkPaid: (index: number) => void;
  onRemove: (index: number) => void;
  onAdd: () => void;
  onImportEMIs: () => void;
  onOpenImportPrev: () => void;
};

export default function ExpensesSection({
  mode,
  lineItems,
  totalExpenses,
  prevPlanHasItems,
  onUpdate,
  onMarkPaid,
  onRemove,
  onAdd,
  onImportEMIs,
  onOpenImportPrev,
}: Props) {
  return (
    <SectionCard>
      <SectionTitle>Estimated Expenses</SectionTitle>
      <LineItemGrid>
        {lineItems.map((item, index) =>
          item.paid ? null : (
            <LineItemRow key={item.id}>
              <LineItemField $flex={1.2}>
                <FinanceSelect
                  value={item.category}
                  onChange={(e) => onUpdate(index, "category", e.target.value)}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </FinanceSelect>
              </LineItemField>
              <LineItemField>
                <FinanceInput
                  type="number"
                  min={0}
                  placeholder="Amount"
                  value={item.amount || ""}
                  onChange={(e) => onUpdate(index, "amount", Number(e.target.value))}
                />
              </LineItemField>
              <LineItemField>
                <FinanceInput
                  type="text"
                  placeholder="Note (required)"
                  value={item.note || ""}
                  onChange={(e) => onUpdate(index, "note", e.target.value)}
                />
              </LineItemField>
              <MarkPaidButton
                onClick={() => onMarkPaid(index)}
                disabled={!item.category || !item.amount}
                title="Mark as paid"
              >
                ✓
              </MarkPaidButton>
              <RemoveButton onClick={() => onRemove(index)} title="Remove">
                ✕
              </RemoveButton>
            </LineItemRow>
          )
        )}
      </LineItemGrid>

      <ExpenseActions>
        <AddButton onClick={onAdd}>+ Add Expense</AddButton>
        <AddButton onClick={onImportEMIs}>📥 Import existing loan EMIs</AddButton>
        <AddButton
          onClick={onOpenImportPrev}
          disabled={!prevPlanHasItems}
          title={
            !prevPlanHasItems
              ? `No previous ${mode === "monthly" ? "month" : "year"} plan to import from`
              : undefined
          }
        >
          📋 Import from last {mode === "monthly" ? "month" : "year"}
        </AddButton>
      </ExpenseActions>

      <TotalRow>
        <span>Total Estimated Expenses</span>
        <span>{formatCurrency(totalExpenses)}</span>
      </TotalRow>
    </SectionCard>
  );
}
