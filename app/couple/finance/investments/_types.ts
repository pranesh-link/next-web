export type Investment = {
  id: string;
  name: string;
  assetType: "GOLD" | "SILVER" | "STOCK" | "MUTUAL_FUND";
  mode: "LUMPSUM" | "SIP";
  ticker?: string | null;
  exchange?: "NSE" | "BSE" | null;
  quantity?: number | null;
  quantityGrams?: number | null;
  investedAmount: number;
  currentPrice?: number | null;
  currentValue?: number | null;
  sipAmount?: number | null;
  sipDayOfMonth?: number | null;
  startDate: string | Date;
  nextSipDate?: string | Date | null;
};

export type FormState = {
  name: string;
  assetType: "GOLD" | "SILVER" | "STOCK" | "MUTUAL_FUND";
  mode: "LUMPSUM" | "SIP";
  ticker: string;
  exchange: "NSE" | "BSE";
  quantity: string;
  quantityGrams: string;
  investedAmount: string;
  currentValue: string;
  sipAmount: string;
  sipDayOfMonth: string;
  startDate: string;
  nextSipDate: string;
};

export type FieldErrors = Partial<Record<keyof FormState, string[]>>;
