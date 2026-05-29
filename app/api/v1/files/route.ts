import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/mp4",
  "audio/webm",
]);

/**
 * Lazily loads firebase-admin and returns the storage bucket.
 */
async function getStorageBucket() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) return null;

  const moduleName = "firebase-admin";
  const adminModule = await (import(/* webpackIgnore: true */ moduleName) as Promise<any>);
  const firebaseAdmin = adminModule.default || adminModule;

  if (!firebaseAdmin.apps || firebaseAdmin.apps.length === 0) {
    const credential = JSON.parse(
      Buffer.from(serviceAccountJson, "base64").toString("utf-8"),
    );
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(credential),
      storageBucket: "luvverse-pranaish.firebasestorage.app",
    });
  }

  return firebaseAdmin.storage().bucket();
}

export function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/files — Upload a file (image or audio) to Firebase Storage.
 *
 * @param request - Multipart form data with a `file` field.
 * @returns JSON `{ url, filename }`.
 * @remarks Auth: requires session or Bearer JWT. Max 10MB.
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400, headers: corsHeaders() },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum 10MB." },
        { status: 413, headers: corsHeaders() },
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 415, headers: corsHeaders() },
      );
    }

    const bucket = await getStorageBucket();
    if (!bucket) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503, headers: corsHeaders() },
      );
    }

    const ext = file.name.split(".").pop() || "bin";
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `chat/${userId}/${uniqueName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: { uploadedBy: userId },
      },
    });

    await fileRef.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return NextResponse.json(
      { url, filename: uniqueName },
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
