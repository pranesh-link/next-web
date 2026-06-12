import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
  "application/octet-stream",
]);
const CHAT_BUCKET = "chat-media";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/files — Upload a file (image or audio) to Supabase Storage.
 *
 * @param request - Multipart form data with a `file` field.
 * @returns JSON `{ url, path, filename }`.
 * @remarks Auth: requires session or Bearer JWT. Max 10MB.
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503, headers: corsHeaders() });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400, headers: corsHeaders() });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 413, headers: corsHeaders() });
    }

    const contentType = file.type || "application/octet-stream";
    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${contentType}` },
        { status: 415, headers: corsHeaders() },
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `${userId}/${uniqueName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from(CHAT_BUCKET)
      .upload(storagePath, buffer, { contentType, upsert: false });

    if (uploadError) {
      console.error("[files] Supabase upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500, headers: corsHeaders() });
    }

    const { data: urlData } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(storagePath);

    return NextResponse.json(
      { url: urlData.publicUrl, path: storagePath, filename: uniqueName },
      { status: 201, headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[files] Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * DELETE /api/v1/files — Delete a file from Supabase Storage by path.
 */
export async function DELETE(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    }
    const { path } = await request.json() as { path: string };
    if (!path || !path.startsWith(`${userId}/`)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400, headers: corsHeaders() });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503, headers: corsHeaders() });
    }
    const { error } = await supabase.storage.from(CHAT_BUCKET).remove([path]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders() });
    }
    return NextResponse.json({ success: true }, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
