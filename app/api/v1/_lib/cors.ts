import { NextResponse } from "next/server";

export function corsHeaders(cacheControl?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };
  if (cacheControl) {
    headers["Cache-Control"] = cacheControl;
  }
  return headers;
}

export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}
