/**
 * Shared color map for suggestion / insight chips across modules.
 *
 * Used by the budget-planner suggestions and the lifestyle/wellness
 * suggestions to render consistent type-based color accents.
 */
export const SUGGESTION_COLORS: Record<string, string> = {
  warning: "#f59e0b",
  info: "#3b82f6",
  success: "#22c55e",
  danger: "#ef4444",
};

/** Suggestion chip semantic types. */
export type SuggestionType = "warning" | "info" | "success" | "danger";
