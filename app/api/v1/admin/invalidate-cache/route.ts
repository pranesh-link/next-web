import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { CACHE_TAGS } from "@/_lib/cache";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/admin/invalidate-cache
 *
 * Invalidates Next.js Data Cache tags. Admin-only.
 * Body: { tags?: string[] }   — defaults to ALL finance + couple tags.
 *
 * @remarks POST · auth: admin-only
 */
export async function POST(request: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401, headers: corsHeaders() },
    );
  }

  const body = await request.json().catch(() => ({}));
  const tags: string[] =
    body.tags && Array.isArray(body.tags)
      ? body.tags
      : Object.values(CACHE_TAGS);

  const invalidated: string[] = [];
  for (const tag of tags) {
    revalidateTag(tag);
    invalidated.push(tag);
  }

  return NextResponse.json(
    { success: true, invalidated },
    { headers: corsHeaders() },
  );
}
