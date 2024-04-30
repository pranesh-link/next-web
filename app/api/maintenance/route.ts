import { CORS_MODE } from "@/_constants/profile";
import { NextResponse } from "next/server";

export async function GET() {
  const maintenance = await (
    await fetch(`${process.env.NEXT_PUBLIC_CMS_SERVER}/maintenance.json`, {
      mode: CORS_MODE,
      cache: "no-store",
    })
  ).json();

  return NextResponse.json(maintenance);
}
