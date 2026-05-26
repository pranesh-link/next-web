import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { archiveAllRead as archiveAllReadService } from "@/_services/finance/notification-service";

/**
 * PUT /api/v1/finance/notifications/archive-all-read
 * Archive all read notifications for the current user
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await archiveAllReadService(userId);

    return NextResponse.json({
      success: true,
      message: "All read notifications archived",
    });
  } catch (error) {
    console.error("[v1/finance/notifications/archive-all-read] PUT error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to archive all read notifications";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
