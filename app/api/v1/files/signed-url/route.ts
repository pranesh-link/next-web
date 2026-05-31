/**
 * GET /api/v1/files/signed-url?path=chat/userId/filename.ext
 *
 * Returns a fresh signed URL for downloading an encrypted file.
 * Requires authentication. Only allows accessing files in paths starting
 * with "chat/" to prevent path traversal.
 */
import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";

async function getStorageBucket() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) return null;

  const moduleName = "firebase-admin";
  const adminModule = (await import(
    /* webpackIgnore: true */ moduleName
  )) as any;
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

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path || !path.startsWith("chat/")) {
      return NextResponse.json(
        { error: "Invalid path" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const bucket = await getStorageBucket();
    if (!bucket) {
      return NextResponse.json(
        { error: "Storage not configured" },
        { status: 503, headers: corsHeaders() },
      );
    }

    const fileRef = bucket.file(path);
    const [signedUrl] = await fileRef.getSignedUrl({
      action: "read" as const,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return NextResponse.json({ url: signedUrl }, { headers: corsHeaders() });
  } catch (error) {
    console.error("[files/signed-url] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
