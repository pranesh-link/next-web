import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { db } from "@db";
import { coupleMembers, coupleMessages } from "@db/schema";
import { eq, and, ne, sql, count as drizzleCount } from "drizzle-orm";

/** SSE streams are capped at 30 s on Vercel Hobby. */
export const maxDuration = 30;

/**
 * GET — SSE stream that emits the latest message count + newest message every 3 seconds.
 *
 * @returns A `text/event-stream` Response. The frontend should reconnect automatically via EventSource.
 * @remarks GET · auth: NextAuth session or Bearer JWT. Closes after ~28 s to stay within Vercel timeout.
 */
export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const member = await db.query.coupleMembers.findFirst({ where: eq(coupleMembers.userId, userId) });
  if (!member) {
    return NextResponse.json({ success: false, error: "No couple found" }, { status: 404 });
  }

  const { coupleId } = member;

  // Find the partner's userId for typing key lookups
  const partnerMember = await db.query.coupleMembers.findFirst({
    where: and(eq(coupleMembers.coupleId, member.coupleId), ne(coupleMembers.userId, userId)),
    columns: { userId: true },
  });
  const partnerUserId = partnerMember?.userId ?? null;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const deadline = Date.now() + 28_000;
      const POLL_MS = 1_500;

      while (Date.now() < deadline) {
        try {
          const [countResult, latest, partnerMemberSnapshot] = await Promise.all([
            db.select({ value: drizzleCount() }).from(coupleMessages).where(eq(coupleMessages.coupleId, coupleId)),
            db.query.coupleMessages.findFirst({
              where: eq(coupleMessages.coupleId, coupleId),
              orderBy: (t, { desc: d }) => [d(t.createdAt)],
              columns: {
                id: true,
                senderId: true,
                content: true,
                iv: true,
                encrypted: true,
                type: true,
                readBy: true,
                createdAt: true,
              },
            }),
            partnerUserId
              ? db.query.coupleMembers.findFirst({
                  where: and(eq(coupleMembers.coupleId, coupleId), eq(coupleMembers.userId, partnerUserId)),
                  columns: { typingAt: true },
                })
              : Promise.resolve(null),
          ]);
          const count = Number(countResult[0]?.value ?? 0);

          const TYPING_TTL_MS = 6_000;
          const isTyping =
            !!partnerMemberSnapshot?.typingAt &&
            Date.now() - new Date(partnerMemberSnapshot.typingAt).getTime() < TYPING_TTL_MS;

          const payload = JSON.stringify({ count, latest, partnerTyping: isTyping });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          // ignore transient DB errors; keep the stream open
        }

        await new Promise<void>((resolve) => setTimeout(resolve, POLL_MS));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
