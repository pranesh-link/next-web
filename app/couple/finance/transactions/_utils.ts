export type Transaction = {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  date: string;
  accountId: string;
  accountName?: string;
  account?: { name: string };
};

export type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

export type Notification = {
  message: string;
  type: "success" | "error";
};

export type Filters = {
  month: string;
  category: string;
  accountId: string;
};

export const CATEGORIES = [
  "Food",
  "Rent",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Education",
  "Salary",
  "Freelance",
  "Investment",
  "Gold",
  "Silver",
  "Stocks",
  "SIP",
  "Fixed Deposit",
  "Recurring Deposit",
  "EMI",
  "Utilities",
  "Other",
];
