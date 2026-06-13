/**
 * Supabase Storage helper (shared between Next.js and Fastify server).
 */
import { createClient } from "@supabase/supabase-js";

const CHAT_BUCKET = "chat-media";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function deleteStorageFiles(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  const { error } = await supabase.storage.from(CHAT_BUCKET).remove(paths);
  if (error) console.error("[storage] deleteStorageFiles failed:", error);
}
