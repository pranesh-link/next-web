import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import {
  scanReceipt,
  checkReceiptScanRateLimit,
} from "@/_services/finance/receipt-scan-service";

export const maxDuration = 60;

export async function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/finance/scan-receipt
 *
 * Scan a receipt image using Gemini AI and return parsed transactions.
 *
 * @remarks POST · auth: Bearer JWT or session.
 */
export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders() },
    );
  }

  if (!checkReceiptScanRateLimit(userId)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: corsHeaders() },
    );
  }

  const formData = await req.formData();
  const file = formData.get("receipt") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No receipt file provided" },
      { status: 400, headers: corsHeaders() },
    );
  }

  const result = await scanReceipt(file);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status, headers: corsHeaders() },
    );
  }

  return NextResponse.json(result.body, {
    status: result.status,
    headers: corsHeaders(),
  });
}
