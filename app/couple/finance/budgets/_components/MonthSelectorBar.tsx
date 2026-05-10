"use client";

import {
  MonthSelector,
  MonthArrowButton,
  MonthLabel,
  MonthInput,
} from "../_styled";
import { formatMonthLabel, shiftMonth } from "../_utils";

type Props = {
  month: string;
  onChange: (month: string) => void;
};

export default function MonthSelectorBar({ month, onChange }: Props) {
  return (
    <MonthSelector>
      <MonthArrowButton
        type="button"
        onClick={() => onChange(shiftMonth(month, -1))}
        aria-label="Previous month"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </MonthArrowButton>

      <MonthLabel>{formatMonthLabel(month)}</MonthLabel>

      <MonthArrowButton
        type="button"
        onClick={() => onChange(shiftMonth(month, 1))}
        aria-label="Next month"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </MonthArrowButton>

      <MonthInput
        type="month"
        value={month}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        aria-label="Select month"
      />
    </MonthSelector>
  );
}
