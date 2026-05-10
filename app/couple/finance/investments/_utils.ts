import type { FormState } from "./_types";

export const initialState: FormState = {
  name: "",
  assetType: "MUTUAL_FUND",
  mode: "LUMPSUM",
  ticker: "",
  exchange: "NSE",
  quantity: "",
  quantityGrams: "",
  investedAmount: "",
  currentValue: "",
  sipAmount: "",
  sipDayOfMonth: "",
  startDate: new Date().toISOString().slice(0, 10),
  nextSipDate: "",
};

export { formatCurrency } from "@/_lib/formatters";
