import { StylesConfig } from "react-select";

export type SelectOption = { value: string; label: string };

export { EASING } from "@/couple/_constants/theme";

export { formatCurrency, formatDate } from "@/_lib/formatters";

export function formatDateTime(d: string | Date): string {
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export { typeIcon, typeLabel } from "@/couple/finance/_lib/account-helpers";

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

export const accountTypeOptions: SelectOption[] = [
  { value: "SAVINGS_ACCOUNT", label: "🏦 Savings Account" },
  { value: "CREDIT_ACCOUNT", label: "🏧 Credit Account" },
  { value: "CREDIT_CARD", label: "💳 Credit Card" },
  { value: "RECURRING_DEPOSIT", label: "🔄 Recurring Deposit" },
  { value: "FIXED_DEPOSIT", label: "🔒 Fixed Deposit" },
];

export type Account = {
  id: string;
  name: string;
  nickname: string | null;
  type: string;
  balance: number;
  isEmergencyFund: boolean;
  isPinned: boolean;
  isSalaryAccount: boolean;
  userId: string;
  user: { id: string; name: string | null };
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type ActivityItem = {
  id: string;
  date: string | Date;
  source: "balance" | "transaction";
  amount: number;
  change: number;
  balance: number;
  note: string | null;
  description: string | null;
  category: string | null;
  type: string | null;
};

export type ActivityFilter = "all" | "balance" | "transaction";

export type Notification = { message: string; type: "success" | "error" };
