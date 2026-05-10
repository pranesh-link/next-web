import { auth } from "@/_lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { updateLoanScheduleFromRawText } from "@/_services/finance/update-schedule-service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { loanId?: string; rawScheduleText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = await updateLoanScheduleFromRawText(
    session.user.id,
    body.loanId ?? "",
    body.rawScheduleText ?? ""
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.body, { status: result.status });
}
