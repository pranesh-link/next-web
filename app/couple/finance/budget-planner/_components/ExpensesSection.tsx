"use client";

import { Check, X, Plus, Download, ClipboardList } from "lucide-react";
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
import {
  ESTIMATED_EXPENSES_TITLE,
  SELECT_CATEGORY,
  AMOUNT_PLACEHOLDER,
  NOTE_PLACEHOLDER,
  MARK_AS_PAID,
  REMOVE,
  ADD_EXPENSE,
  IMPORT_LOAN_EMIS,
  IMPORT_PREV_MONTHLY,
  IMPORT_PREV_YEARLY,
  NO_PREV_PLAN_MONTHLY,
  NO_PREV_PLAN_YEARLY,
  METRIC_TOTAL_ESTIMATED,
} from "../_labels";

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
      <SectionTitle>{ESTIMATED_EXPENSES_TITLE}</SectionTitle>
      <LineItemGrid>
        {lineItems.map((item, index) =>
          item.paid ? null : (
            <LineItemRow key={item.id}>
              <LineItemField $flex={1.2}>
                <FinanceSelect
                  value={item.category}
                  onChange={(e) => onUpdate(index, "category", e.target.value)}
                >
                  <option value="">{SELECT_CATEGORY}</option>
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
                  placeholder={AMOUNT_PLACEHOLDER}
                  value={item.amount || ""}
                  onChange={(e) => onUpdate(index, "amount", Number(e.target.value))}
                />
              </LineItemField>
              <LineItemField>
                <FinanceInput
                  type="text"
                  placeholder={NOTE_PLACEHOLDER}
                  value={item.note || ""}
                  onChange={(e) => onUpdate(index, "note", e.target.value)}
                />
              </LineItemField>
              <MarkPaidButton
                onClick={() => onMarkPaid(index)}
                disabled={!item.category || !item.amount}
                title={MARK_AS_PAID}
              >
                <Check size={14} />
              </MarkPaidButton>
              <RemoveButton onClick={() => onRemove(index)} title={REMOVE}>
                <X size={14} />
              </RemoveButton>
            </LineItemRow>
          )
        )}
      </LineItemGrid>

      <ExpenseActions>
        <AddButton onClick={onAdd}>
          <Plus size={14} /> {ADD_EXPENSE}
        </AddButton>
        <AddButton onClick={onImportEMIs}>
          <Download size={14} /> {IMPORT_LOAN_EMIS}
        </AddButton>
        <AddButton
          onClick={onOpenImportPrev}
          disabled={!prevPlanHasItems}
          title={
            !prevPlanHasItems
              ? mode === "monthly"
                ? NO_PREV_PLAN_MONTHLY
                : NO_PREV_PLAN_YEARLY
              : undefined
          }
        >
          <ClipboardList size={14} />{" "}
          {mode === "monthly" ? IMPORT_PREV_MONTHLY : IMPORT_PREV_YEARLY}
        </AddButton>
      </ExpenseActions>

      <TotalRow>
        <span>{METRIC_TOTAL_ESTIMATED}</span>
        <span>{formatCurrency(totalExpenses)}</span>
      </TotalRow>
    </SectionCard>
  );
}
