import type { getDashboardInsights } from "@/couple/finance/_actions/insights";

export type DashboardData = Extract<
  Awaited<ReturnType<typeof getDashboardInsights>>,
  { success: true }
>["data"];
