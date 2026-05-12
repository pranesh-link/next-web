import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import prisma from "@/_lib/prisma";

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

  const member = await prisma.coupleMember.findFirst({ where: { userId } });
  if (!member) {
    return NextResponse.json({ success: false, error: "No couple found" }, { status: 404 });
  }

  const { coupleId } = member;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const deadline = Date.now() + 28_000;
      const POLL_MS = 3_000;

      while (Date.now() < deadline) {
        try {
          const [count, latest] = await Promise.all([
            prisma.coupleMessage.count({ where: { coupleId } }),
            prisma.coupleMessage.findFirst({
              where: { coupleId },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                senderId: true,
                content: true,
                type: true,
                createdAt: true,
              },
            }),
          ]);

          const payload = JSON.stringify({ count, latest });
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
