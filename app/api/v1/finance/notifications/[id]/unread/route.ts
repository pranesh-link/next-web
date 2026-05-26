import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { markAsUnread } from "@/_services/finance/notification-service";

/**
 * PUT /api/v1/finance/notifications/[id]/unread
 * Mark a notification as unread
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const notificationId = params.id;

    await markAsUnread(notificationId, userId);

    return NextResponse.json({
      success: true,
      message: "Notification marked as unread",
    });
  } catch (error) {
    console.error("[v1/finance/notifications/[id]/unread] PUT error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to mark as unread";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
