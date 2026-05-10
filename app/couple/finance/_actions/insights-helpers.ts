/**
 * Format the current date as a `YYYY-MM` month key.
 *
 * @returns The current month in `YYYY-MM` form using local time.
 */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
