"use client";

import {
  HiddenRadio,
  RadioCircle,
  RadioGroup,
  RadioLabel,
} from "../TransactionForm.styled";
import type { TransactionData } from "./types";

/**
 * Props for {@link TypeRadioGroup}.
 */
export interface TypeRadioGroupProps {
  /** Currently selected transaction type. */
  value: TransactionData["type"];
  /** Called with the new type when the user changes the selection. */
  onChange: (next: TransactionData["type"]) => void;
  /** When true, all radios are disabled. */
  disabled?: boolean;
}

/**
 * Custom-styled INCOME / EXPENSE radio group.
 *
 * @param props - See {@link TypeRadioGroupProps}.
 * @returns A two-option radio group that calls `onChange` on selection.
 */
export default function TypeRadioGroup({
  value,
  onChange,
  disabled,
}: TypeRadioGroupProps) {
  return (
    <RadioGroup>
      {(["INCOME", "EXPENSE"] as const).map((t) => {
        const isIncome = t === "INCOME";
        const color = isIncome ? "#16a34a" : "#dc2626";
        return (
          <RadioLabel key={t} $variant={isIncome ? "income" : "expense"}>
            <HiddenRadio
              type="radio"
              name="txnType"
              value={t}
              checked={value === t}
              onChange={() => onChange(t)}
              disabled={disabled}
            />
            <RadioCircle $checked={value === t} $color={color} />
            {isIncome ? "Income" : "Expense"}
          </RadioLabel>
        );
      })}
    </RadioGroup>
  );
}
