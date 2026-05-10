export { formatCurrency } from "@/_lib/formatters";

export function getScoreColor(score: number): string {
  if (score > 70) return "var(--success)";
  if (score >= 40) return "#f59e0b";
  return "var(--danger)";
}
