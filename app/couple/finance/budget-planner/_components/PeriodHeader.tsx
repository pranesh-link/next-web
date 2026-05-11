"use client";

import { ChevronLeft, ChevronRight, Save, Loader, RotateCcw, Trash2 } from "lucide-react";

import LastUpdatedBadge from "@/couple/_components/shared/LastUpdatedBadge";
import {
  formatMonthLabel,
  formatYearLabel,
  shiftMonth,
  shiftYear,
  type SavedPlan,
} from "../_utils";
import {
  MODE_MONTHLY,
  MODE_YEARLY,
  INCOME_LABEL_MONTHLY,
  INCOME_LABEL_YEARLY,
  ARIA_SAVE_PLAN,
  ARIA_RESET,
  ARIA_DELETE_PLAN,
} from "../_labels";
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
          {MODE_MONTHLY}
        </ModeButton>
        <ModeButton $active={mode === "yearly"} onClick={() => onModeChange("yearly")}>
          {MODE_YEARLY}
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
          <ChevronLeft size={18} />
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
          <ChevronRight size={18} />
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
            {mode === "monthly" ? INCOME_LABEL_MONTHLY : INCOME_LABEL_YEARLY}
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
            title={submitting ? "Saving…" : ARIA_SAVE_PLAN}
            aria-label={ARIA_SAVE_PLAN}
          >
            {submitting ? <Loader size={16} /> : <Save size={16} />}
          </IconActionButton>
          <IconActionButton onClick={onReset} title={ARIA_RESET} aria-label={ARIA_RESET}>
            <RotateCcw size={16} />
          </IconActionButton>
          {savedPlan && (
            <IconActionButton
              $variant="danger"
              onClick={onDelete}
              disabled={submitting}
              title={ARIA_DELETE_PLAN}
              aria-label={ARIA_DELETE_PLAN}
            >
              <Trash2 size={16} />
            </IconActionButton>
          )}
        </TopActionGroup>
      </MonthSelector>
    </>
  );
}
