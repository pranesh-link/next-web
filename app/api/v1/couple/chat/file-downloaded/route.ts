import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { db } from "@db";
import { coupleMembers, coupleMessages } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { deleteStorageFiles } from "@/_lib/supabase-storage";

const schema = z.object({
  messageId: z.string().uuid(),
});

export function OPTIONS() {
  return handleOptions();
}

/**
 * POST /api/v1/couple/chat/file-downloaded
 *
 * Called by a device after it has saved an IMAGE/VOICE message's file
 * to local storage. Adds the user to `fileDownloadedBy`.
 *
 * When both couple members are in `fileDownloadedBy`:
 * - Deletes the file from Supabase Storage
 * - Deletes the message row from the DB
 *
 * @returns JSON `{ success, fileDeleted, messageDeleted }`.
 */
export async function POST(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    }

    const { messageId } = schema.parse(await request.json());

    const member = await db.query.coupleMembers.findFirst({
      where: eq(coupleMembers.userId, userId),
      columns: { coupleId: true },
    });

    if (!member) {
      return NextResponse.json({ error: "No couple found" }, { status: 404, headers: corsHeaders() });
    }

    // Fetch all member IDs for this couple
    const allMembers = await db
      .select({ userId: coupleMembers.userId })
      .from(coupleMembers)
      .where(eq(coupleMembers.coupleId, member.coupleId));
    const allMemberIds = allMembers.map((m) => m.userId);

    const message = await db.query.coupleMessages.findFirst({
      where: and(
        eq(coupleMessages.id, messageId),
        eq(coupleMessages.coupleId, member.coupleId),
      ),
      columns: { id: true, fileDownloadedBy: true, fileStoragePath: true, type: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404, headers: corsHeaders() });
    }

    // Idempotent: already marked
    if (message.fileDownloadedBy.includes(userId)) {
      return NextResponse.json({ success: true, fileDeleted: false, messageDeleted: false }, { headers: corsHeaders() });
    }

    const updatedDownloadedBy = [...message.fileDownloadedBy, userId];
    await db.update(coupleMessages)
      .set({ fileDownloadedBy: updatedDownloadedBy })
      .where(eq(coupleMessages.id, messageId));

    // All couple members have downloaded — clean up storage + DB
    const allDownloaded = allMemberIds.every((id) => updatedDownloadedBy.includes(id));

    let fileDeleted = false;
    let messageDeleted = false;

    if (allDownloaded) {
      // Delete from Supabase Storage via REST helper
      if (message.fileStoragePath) {
        await deleteStorageFiles([message.fileStoragePath]);
        fileDeleted = true;
      }

      // Delete message row
      await db.delete(coupleMessages).where(eq(coupleMessages.id, messageId));
      messageDeleted = true;
    }

    return NextResponse.json({ success: true, fileDeleted, messageDeleted }, { headers: corsHeaders() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400, headers: corsHeaders() });
    }
    console.error("[file-downloaded]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
