export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type Notification = {
  message: string;
  type: "success" | "error";
};

export { EASING } from "@/couple/_constants/theme";

export const RING_RADIUS = 48;
export const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export { formatCurrency } from "@/_lib/formatters";

export function getMonthsLeft(deadline: string | Date): number {
  const target = new Date(deadline);
  const now = new Date();
  const diff =
    (target.getFullYear() - now.getFullYear()) * 12 +
    (target.getMonth() - now.getMonth());
  return diff;
}
