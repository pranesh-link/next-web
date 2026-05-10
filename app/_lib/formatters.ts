/**
 * Shared formatting helpers for the Coupletastic / finance modules.
 *
 * Centralises currency, month-label, and date formatting so all consumers
 * produce identical output. Do not duplicate these helpers in feature folders;
 * import from `@/_lib/formatters` instead.
 */

/**
 * Format a number as INR currency using the Indian (en-IN) locale.
 *
 * Uses `Intl.NumberFormat` with `style: "currency"`, which applies the
 * locale's default minimum fraction digits (2 for INR), so whole-rupee
 * amounts render as `₹1,234.00`.
 *
 * @param amount - Numeric value to format.
 * @returns Localised currency string (e.g. `"₹1,23,456.78"`).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a `YYYY-MM` month string as a long human-readable label.
 *
 * @param month - Month in `YYYY-MM` format (e.g. `"2026-01"`).
 * @returns Long month-and-year label (e.g. `"January 2026"`).
 */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a date as a short India-locale date string.
 *
 * Output shape: `DD Mon YYYY` (e.g. `"15 Mar 2026"`). Matches the existing
 * en-IN formatting used across the finance module — kept en-IN (not en-US)
 * to preserve behaviour at all current call sites.
 *
 * @param date - `Date` instance or any value accepted by `new Date(...)`.
 * @returns Localised date string.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
