import { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth.js";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

type AuthReq = { userId: string };

const CHAT_BUCKET = "chat-media";
const ALLOWED_TYPES = new Set(["image/jpeg","image/jpg","image/png","image/webp","audio/mpeg","audio/mp4","audio/webm","application/octet-stream"]);
const MAX_SIZE = 10 * 1024 * 1024;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function registerFilesRoute(app: FastifyInstance) {
  app.post("/", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const supabase = getSupabase();
    if (!supabase) return reply.code(503).send({ error: "Storage not configured" });

    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "No file provided" });

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) chunks.push(chunk as Buffer);
    const buffer = Buffer.concat(chunks);

    if (buffer.length > MAX_SIZE) return reply.code(413).send({ error: "File too large. Maximum 10MB." });

    const contentType = data.mimetype || "application/octet-stream";
    if (!ALLOWED_TYPES.has(contentType)) return reply.code(415).send({ error: `Unsupported file type: ${contentType}` });

    const ext = (data.filename.split(".").pop() ?? "bin").toLowerCase();
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `${userId}/${uniqueName}`;

    const { error: uploadError } = await supabase.storage.from(CHAT_BUCKET).upload(storagePath, buffer, { contentType, upsert: false });
    if (uploadError) return reply.code(500).send({ error: uploadError.message });

    const { data: urlData } = supabase.storage.from(CHAT_BUCKET).getPublicUrl(storagePath);
    return reply.code(201).send({ url: urlData.publicUrl, path: storagePath, filename: uniqueName });
  });

  app.delete("/", { preHandler: requireAuth }, async (req, reply) => {
    const { userId } = req as unknown as AuthReq & typeof req;
    const { path } = req.body as { path?: string };
    if (!path || !path.startsWith(`${userId}/`)) return reply.code(400).send({ error: "Invalid path" });
    const supabase = getSupabase();
    if (!supabase) return reply.code(503).send({ error: "Storage not configured" });
    const { error } = await supabase.storage.from(CHAT_BUCKET).remove([path]);
    if (error) return reply.code(500).send({ error: error.message });
    return reply.send({ success: true });
  });

  // GET /api/v1/files/signed-url?path=chat/userId/filename — replaces Firebase signed URL
  app.get("/signed-url", { preHandler: requireAuth }, async (req, reply) => {
    const qs = req.query as Record<string, string>;
    const path = qs.path;

    if (!path || !path.startsWith("chat/")) {
      return reply.code(400).send({ error: "Invalid path" });
    }

    const supabase = getSupabase();
    if (!supabase) return reply.code(503).send({ error: "Storage not configured" });

    const { data, error } = await supabase.storage.from(CHAT_BUCKET).createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) {
      return reply.code(500).send({ error: error?.message ?? "Failed to create signed URL" });
    }

    return reply.send({ url: data.signedUrl });
  });
}
