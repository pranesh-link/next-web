import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/_lib/auth-utils";
import { unarchiveNotification as unarchiveNotificationService } from "@/_services/finance/notification-service";

/**
 * PUT /api/v1/finance/notifications/[id]/unarchive
 * Unarchive a single notification
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;
    const notificationId = params.id;

    await unarchiveNotificationService(notificationId, userId);

    return NextResponse.json({
      success: true,
      message: "Notification unarchived",
    });
  } catch (error) {
    console.error("[v1/finance/notifications/[id]/unarchive] PUT error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to unarchive notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
