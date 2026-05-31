import { NextResponse } from "next/server";
import { purgeExpiredMessages, cleanupDeliveredMessages } from "@/_services/chat/message-purge";

/**
 * POST — Cron endpoint to purge expired and delivered messages.
 * Secured via CRON_SECRET header (Vercel Cron or manual trigger).
 *
 * @returns JSON with purge counts.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const expired = await purgeExpiredMessages();
    const delivered = await cleanupDeliveredMessages();

    return NextResponse.json({
      success: true,
      purged: { expired, delivered },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Purge failed" },
      { status: 500 },
    );
  }
}
