import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { acceptInviteByToken } from "@/_services/finance/couple/invites";
import { sendSilentPushToUser } from "@/_services/finance/push-service";

/**
 * POST — Accept a couple invite by token (mobile).
 *
 * @param request - Body: `{ token: string }`.
 * @returns JSON `{ ok: true, coupleId: string }` with HTTP 200.
 * @remarks POST · auth: Bearer JWT.
 */
export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const token = typeof body?.token === "string" ? body.token.trim() : null;
    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const member = await acceptInviteByToken(token, userId);
    const coupleId = member.coupleId;

    // Fire silent push to the acceptor (this device) so its bootstrap
    // callback in app.dart fires immediately — even though the caller will
    // call ensureBootstrapped() anyway, belt-and-suspenders.
    sendSilentPushToUser(userId, { type: "COUPLE_FORMED", coupleId }).catch(() => {});

    return NextResponse.json({ ok: true, coupleId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to accept invite";
    const status = message.includes("not found") || message.includes("no longer pending") ? 422 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
