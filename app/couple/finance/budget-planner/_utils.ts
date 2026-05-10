/* ── Types ──────────────────────────────────────────── */

export type LineItem = {
  id: string;
  category: string;
  amount: number;
  note?: string;
  paid?: boolean;
};

export type SavedPlan = {
  id: string;
  monthAndYear: string;
  mode: string;
  income: number;
  lineItems: unknown;
  coupleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastUpdatedBy?: { id: string; name: string | null; email: string | null } | null;
};

export type Notification = {
  message: string;
  type: "success" | "error";
};

export type Suggestion = {
  icon: string;
  text: string;
  type: "warning" | "info" | "success" | "danger";
};

export type ImportClassification =
  | { kind: "duplicate" }
  | { kind: "similar"; existingAmount: number }
  | { kind: "new" };

export type PrevItemRow = LineItem & { _idx: number; _class: ImportClassification };

/* ── Constants ──────────────────────────────────────── */

export { EASING } from "@/couple/_constants/theme";

export const CATEGORIES = [
  "Food",
  "Rent",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "EMI",
  "Credit Card",
  "Utilities",
  "Emergency Fund",
  "Other",
] as const;

export { SUGGESTION_COLORS } from "@/couple/_constants/suggestion-colors";

/* ── Line item factories ────────────────────────────── */

export function newLineItem(partial: Omit<Partial<LineItem>, "id"> = {}): LineItem {
  return {
    id: crypto.randomUUID(),
    category: "",
    amount: 0,
    paid: false,
    ...partial,
  };
}

export function withIds(
  items: Array<Omit<LineItem, "id"> & { id?: string }>
): LineItem[] {
  return items.map((i) => ({ ...i, id: i.id ?? crypto.randomUUID() }));
}

/* ── Date helpers ───────────────────────────────────── */

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export { formatMonthLabel } from "@/_lib/formatters";

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const d = new Date(year, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getCurrentYear(): string {
  return String(new Date().getFullYear());
}

export function formatYearLabel(year: string): string {
  return year;
}

export function shiftYear(year: string, delta: number): string {
  return String(Number(year) + delta);
}

/* ── Import-from-previous classification ────────────── */

export function importKey(item: { category: string; note?: string }): string {
  const note = item.note?.trim().toLowerCase();
  if (note) return `note:${note}`;
  return `cat:${item.category.trim().toLowerCase()}`;
}

export function classifyPrevItem(
  prev: LineItem,
  currentItems: LineItem[],
): ImportClassification {
  const key = importKey(prev);
  let similar: { existingAmount: number } | null = null;
  for (const cur of currentItems) {
    if (importKey(cur) !== key) continue;
    if (cur.amount === prev.amount) return { kind: "duplicate" };
    if (!similar) similar = { existingAmount: cur.amount };
  }
  if (similar) return { kind: "similar", existingAmount: similar.existingAmount };
  return { kind: "new" };
}

/* ── Formatting / math ──────────────────────────────── */

export function formatCurrency(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function categoryAmount(items: LineItem[], cat: string): number {
  return items
    .filter((i) => i.category === cat)
    .reduce((sum, i) => sum + i.amount, 0);
}

export function deltaPercent(prev: number, current: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / Math.abs(prev)) * 100;
}

/* ── Suggestions builder ────────────────────────────── */

export function buildSuggestions(
  income: number,
  items: LineItem[],
  totalExpenses: number,
  remaining: number,
  savingsRate: number
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (savingsRate < 10) {
    suggestions.push({
      icon: "⚠️",
      text: "Your savings are critically low. Review discretionary spending (Shopping, Entertainment).",
      type: "warning",
    });
  } else if (savingsRate < 20) {
    suggestions.push({
      icon: "💡",
      text: "Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
      type: "info",
    });
  } else if (savingsRate < 30) {
    suggestions.push({
      icon: "✅",
      text: "Good savings rate! Consider SIPs or recurring deposits for wealth building.",
      type: "success",
    });
  } else {
    suggestions.push({
      icon: "🎯",
      text: "Excellent! Diversify into equity SIPs, PPF, NPS for long-term growth.",
      type: "success",
    });
  }

  if (categoryAmount(items, "Rent") > income * 0.3) {
    suggestions.push({
      icon: "🏠",
      text: "Housing exceeds 30% of income — consider if downsizing is feasible.",
      type: "warning",
    });
  }

  if (categoryAmount(items, "EMI") > income * 0.4) {
    suggestions.push({
      icon: "💳",
      text: "Debt payments exceed 40% of income. Prioritize clearing high-interest loans.",
      type: "warning",
    });
  }

  if (!items.some((i) => i.category === "Emergency Fund")) {
    suggestions.push({
      icon: "🛡️",
      text: "Add an Emergency Fund contribution (aim for 3-6 months of expenses).",
      type: "info",
    });
  }

  if (categoryAmount(items, "Entertainment") > income * 0.15) {
    suggestions.push({
      icon: "🎬",
      text: "Entertainment spending is high — try capping it at 10% of income.",
      type: "warning",
    });
  }

  const ccAmount = categoryAmount(items, "Credit Card");
  if (ccAmount > income) {
    suggestions.push({
      icon: "🚨",
      text: "Credit card spend exceeds income — you'll carry forward debt. Reduce discretionary usage.",
      type: "danger",
    });
  } else if (ccAmount > income * 0.3) {
    suggestions.push({
      icon: "💳",
      text: "Credit card spending is high. Pay full statement balance to avoid 36-42% APR charges.",
      type: "warning",
    });
  }

  if (items.some((i) => i.category === "Credit Card")) {
    suggestions.push({
      icon: "💡",
      text: "Always pay credit card bills in full. Minimum payments compound at 3-4% per month.",
      type: "info",
    });
  }

  if (remaining >= 1000 && remaining < 5000) {
    suggestions.push({
      icon: "📈",
      text: "Start a ₹500-1000/month SIP in an index fund.",
      type: "info",
    });
  } else if (remaining >= 5000 && remaining < 15000) {
    suggestions.push({
      icon: "📈",
      text: "Split: 60% SIP (equity mutual fund), 20% PPF/NPS, 20% liquid fund.",
      type: "info",
    });
  } else if (remaining >= 15000 && remaining < 50000) {
    suggestions.push({
      icon: "📈",
      text: "Diversify: SIP (40%), PPF (20%), FD/RD (20%), gold ETF (10%), emergency fund (10%).",
      type: "info",
    });
  } else if (remaining >= 50000) {
    suggestions.push({
      icon: "📈",
      text: "Consider: large-cap + mid-cap SIPs, NPS for tax benefit, direct equity, and REITs.",
      type: "info",
    });
  }

  return suggestions;
}
