/**
 * Supabase Storage helpers using the REST API directly (no SDK dependency).
 */

const CHAT_BUCKET = "chat-media";

/**
 * Delete one or more files from Supabase Storage chat-media bucket.
 * Silently ignores configuration errors — callers should treat deletion as best-effort.
 */
export async function deleteStorageFiles(paths: string[]): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || paths.length === 0) return;

  try {
    await fetch(`${url}/storage/v1/object/${CHAT_BUCKET}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: paths }),
    });
  } catch (e) {
    console.error("[storage] deleteStorageFiles failed:", e);
  }
}
