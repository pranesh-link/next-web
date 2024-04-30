import { DEFAULT_APP_CONTEXT } from "@/_constants/common";
import { fetchBaseConfig } from "@/_utils/common/data-fetch";
import { NextResponse } from "next/server";

export async function GET() {
  const baseConfig = await fetchBaseConfig(DEFAULT_APP_CONTEXT.data, false);
  return NextResponse.json(baseConfig);
}
