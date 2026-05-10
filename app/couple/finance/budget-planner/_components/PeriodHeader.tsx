"use client";

import LastUpdatedBadge from "@/couple/_components/shared/LastUpdatedBadge";
import {
  formatMonthLabel,
  formatYearLabel,
  shiftMonth,
  shiftYear,
  type SavedPlan,
} from "../_utils";
import {
  IconActionButton,
  ModeButton,
  ModeToggle,
  MonthArrowButton,
  MonthInput,
  MonthLabel,
  MonthSelector,
  TopActionGroup,
  TopIncomeGroup,
} from "./PeriodHeader.styled";

type Props = {
  /** Current period mode (`monthly` or `yearly`). */
  mode: "monthly" | "yearly";
  /** ISO month (`YYYY-MM`) or year (`YYYY`) string for the selected period. */
  monthAndYear: string;
  /** Income value for the period. */
  income: number;
  /** True while save/delete is in flight. */
  submitting: boolean;
  /** Currently saved plan (used to show last-updated badge and delete btn). */
  savedPlan: SavedPlan | null;
  /** Current user id (for last-updated badge attribution). */
  currentUserId: string | null;
  /** Switch period mode. */
  onModeChange: (mode: "monthly" | "yearly") => void;
  /** Update the selected month/year value. */
  onMonthAndYearChange: (value: string) => void;
  /** Update income value. */
  onIncomeChange: (value: number) => void;
  /** Save the current plan. */
  onSave: () => void;
  /** Reset the form back to defaults. */
  onReset: () => void;
  /** Delete the saved plan. */
  onDelete: () => void;
};

/**
 * Render the budget planner period header: mode toggle, month navigator,
 * income pill, and save/reset/delete action buttons.
 *
 * @param props - {@link Props} carrying period state and parent callbacks.
 * @returns The period header element.
 */
export default function PeriodHeader({
  mode,
  monthAndYear,
  income,
  submitting,
  savedPlan,
  currentUserId,
  onModeChange,
  onMonthAndYearChange,
  onIncomeChange,
  onSave,
  onReset,
  onDelete,
}: Props) {
  return (
    <>
      <ModeToggle>
        <ModeButton $active={mode === "monthly"} onClick={() => onModeChange("monthly")}>
          Monthly
        </ModeButton>
        <ModeButton $active={mode === "yearly"} onClick={() => onModeChange("yearly")}>
          Yearly
        </ModeButton>
      </ModeToggle>

      <MonthSelector>
        <MonthArrowButton
          onClick={() =>
            onMonthAndYearChange(
              mode === "monthly" ? shiftMonth(monthAndYear, -1) : shiftYear(monthAndYear, -1)
            )
          }
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </MonthArrowButton>

        <MonthLabel>
          {mode === "monthly" ? formatMonthLabel(monthAndYear) : formatYearLabel(monthAndYear)}
        </MonthLabel>

        <MonthArrowButton
          onClick={() =>
            onMonthAndYearChange(
              mode === "monthly" ? shiftMonth(monthAndYear, 1) : shiftYear(monthAndYear, 1)
            )
          }
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M9 5l7 7-7 7" />
          </svg>
        </MonthArrowButton>

        {mode === "monthly" && (
          <MonthInput
            type="month"
            value={monthAndYear}
            onChange={(e) => onMonthAndYearChange(e.target.value)}
          />
        )}

        {savedPlan && (
          <LastUpdatedBadge
            name={savedPlan.lastUpdatedBy?.name}
            email={savedPlan.lastUpdatedBy?.email}
            userId={savedPlan.lastUpdatedBy?.id}
            currentUserId={currentUserId}
            updatedAt={savedPlan.updatedAt}
          />
        )}

        <TopIncomeGroup>
          <label htmlFor="top-income">
            {mode === "monthly" ? "Last Credited" : "Annual Income"}
          </label>
          <span aria-hidden>₹</span>
          <input
            id="top-income"
            type="number"
            min={0}
            placeholder={mode === "monthly" ? "0" : "0"}
            value={income || ""}
            onChange={(e) => onIncomeChange(Number(e.target.value))}
          />
        </TopIncomeGroup>

        <TopActionGroup>
          <IconActionButton
            $variant="primary"
            onClick={onSave}
            disabled={submitting}
            title={submitting ? "Saving…" : "Save Plan"}
            aria-label="Save Plan"
          >
            {submitting ? "⋯" : "💾"}
          </IconActionButton>
          <IconActionButton onClick={onReset} title="Reset" aria-label="Reset">
            ↻
          </IconActionButton>
          {savedPlan && (
            <IconActionButton
              $variant="danger"
              onClick={onDelete}
              disabled={submitting}
              title="Delete Plan"
              aria-label="Delete Plan"
            >
              🗑
            </IconActionButton>
          )}
        </TopActionGroup>
      </MonthSelector>
    </>
  );
}
