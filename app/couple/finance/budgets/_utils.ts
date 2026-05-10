export type BudgetItem = {
  budget: {
    id: string;
    category: string;
    limit: number;
    month: string;
  };
  spent: number;
  remaining: number;
  exceeded: boolean;
};

export type Notification = {
  message: string;
  type: "success" | "error";
};

export { EASING } from "@/couple/_constants/theme";

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export { formatCurrency, formatMonthLabel } from "@/_lib/formatters";

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
