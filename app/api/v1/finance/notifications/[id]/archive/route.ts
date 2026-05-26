import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/_lib/auth-utils";
import { archiveNotification as archiveNotificationService } from "@/_services/finance/notification-service";

/**
 * PUT /api/v1/finance/notifications/[id]/archive
 * Archive a single notification
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

    await archiveNotificationService(notificationId, userId);

    return NextResponse.json({
      success: true,
      message: "Notification archived",
    });
  } catch (error) {
    console.error("[v1/finance/notifications/[id]/archive] PUT error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to archive notification";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
