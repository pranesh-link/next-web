import type { StylesConfig } from "react-select";

/** Option shape used by the account react-select. */
export type SelectOption = { value: string; label: string };

/**
 * Build the default income description for a given month.
 *
 * @param month - Optional month string parseable by `Date.parse(month + " 1")`.
 *                When omitted, defaults to the previous month relative to today.
 * @returns A human-readable description such as `Salary for month Mar 2025`.
 */
export function getDefaultDescription(month?: string): string {
  let targetDate: Date;
  if (month) {
    targetDate = new Date(Date.parse(month + " 1"));
  } else {
    const now = new Date();
    targetDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  const short = targetDate.toLocaleString("en-US", {
    month: "short",
    year: "numeric",
  });
  return `Salary for month ${short}`;
}

/**
 * Get today's date as a `YYYY-MM-DD` string suitable for an `<input type="date">`.
 *
 * @returns ISO date portion for the current day.
 */
export function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

/** react-select style overrides for the income-account dropdown. */
export const selectStyles: StylesConfig<SelectOption, false> = {
  control: (base, state) => ({
    ...base,
    borderRadius: 8,
    border: `1px solid ${state.isFocused ? "#3b82f6" : "rgba(0,0,0,0.10)"}`,
    background: "#f8fafc",
    fontFamily: "inherit",
    fontSize: 14,
    boxShadow: "none",
    minHeight: 42,
    cursor: "pointer",
    "&:hover": { borderColor: "#3b82f6" },
  }),
  singleValue: (base) => ({ ...base, color: "#1a1a2e" }),
  menu: (base) => ({
    ...base,
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 8,
    zIndex: 9999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  }),
  option: (base, state) => ({
    ...base,
    fontSize: 14,
    cursor: "pointer",
    background: state.isSelected
      ? "#3b82f6"
      : state.isFocused
        ? "rgba(0,0,0,0.03)"
        : "transparent",
    color: state.isSelected ? "#fff" : "#1a1a2e",
    "&:active": { background: "rgba(0,0,0,0.03)" },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "#94a3b8", padding: "0 8px" }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  input: (base) => ({ ...base, color: "#1a1a2e" }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};
