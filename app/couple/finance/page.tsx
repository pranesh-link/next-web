import { getDashboardInsights } from "@/couple/finance/_actions/insights";
import DashboardClient from "@/couple/finance/_components/DashboardClient";

export default async function DashboardPage() {
  const result = await getDashboardInsights();

  return (
    <DashboardClient
      initialData={result.success ? result.data : null}
      initialError={result.success ? null : result.error}
    />
  );
}
