/**
 * Format a number as INR currency.
 *
 * @param amount - Numeric value to format.
 * @param currency - Currency code. Defaults to INR.
 * @param locale - Locale string. Defaults to en-IN.
 * @returns Formatted currency string.
 */
export function formatCurrency(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a YYYY-MM month string as a human-readable label.
 *
 * @param month - Month in YYYY-MM format.
 * @returns Human-readable month label (e.g. "January 2026").
 */
export function formatMonthLabel(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Format a date as a readable string.
 *
 * @param date - Date or date string.
 * @param options - Intl.DateTimeFormat options.
 * @returns Formatted date string.
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('en-IN', options);
}

/**
 * Format a number as a percentage.
 *
 * @param value - Numeric value.
 * @param decimals - Number of decimal places. Defaults to 1.
 * @returns Formatted percentage string (e.g. "75.5%").
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a large number with K/L/Cr suffix (Indian notation).
 *
 * @param value - Numeric value.
 * @returns Compact formatted string.
 */
export function formatCompact(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toFixed(0)}`;
}
