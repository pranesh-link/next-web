import { auth } from "@/_lib/auth";
import { NextRequest, NextResponse } from "next/server";
import {
  scanReceipt,
  checkReceiptScanRateLimit,
} from "@/_services/finance/receipt-scan-service";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!checkReceiptScanRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const formData = await req.formData();
  const file = formData.get("receipt") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No receipt file provided" }, { status: 400 });
  }

  const result = await scanReceipt(file);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.body, { status: result.status });
}
