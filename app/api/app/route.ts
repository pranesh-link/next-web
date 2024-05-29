import { DEFAULT_APP_CONTEXT } from "@/_constants/common";
import { fetchBaseConfig } from "@/_utils/common/data-fetch";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseConfig = await fetchBaseConfig(DEFAULT_APP_CONTEXT.data);
  return NextResponse.json(baseConfig);
}
