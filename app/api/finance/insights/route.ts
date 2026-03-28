import { NextResponse } from "next/server";
import { auth } from "@/_lib/auth";
import { getDashboardInsights, getFinancialHealthScore } from "@/couple/finance/_actions/insights";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "health-score") {
    const result = await getFinancialHealthScore();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json(result.data);
  }

  const result = await getDashboardInsights();
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json(result.data);
}
