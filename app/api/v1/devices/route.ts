import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { db } from "@db";
import { deviceTokens, users } from "@db/schema";
import { eq, and, lt, not } from "drizzle-orm";
import { z } from "zod/v4";

const registerSchema = z.object({
  token: z.string().min(1).max(256),
  platform: z.enum(["android", "ios", "web"]),
  /// Optional aggregated device info: "Model | OS | AppVersion | Locale | Timezone"
  deviceInfo: z.string().max(512).optional(),
});

const deleteSchema = z.object({
  token: z.string().min(1).max(256),
});

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/devices
 *
 * Lists all device tokens for the authenticated user (for debugging).
 * Returns active status, platform, creation time, and token prefix.
 *
 * @remarks GET · auth: JWT Bearer token
 */
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const devices = await db.query.deviceTokens.findMany({
      where: eq(deviceTokens.userId, userId),
      orderBy: (d, { desc }) => [desc(d.createdAt)],
    });

    // Prune inactive tokens older than 30 days so the list stays clean.
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    db.delete(deviceTokens)
      .where(and(
        eq(deviceTokens.userId, userId),
        eq(deviceTokens.active, false),
        lt(deviceTokens.updatedAt, thirtyDaysAgo)
      ))
      .catch(() => {});

    const sanitizedDevices = devices.map((d) => ({
      id: d.id,
      platform: d.platform,
      active: d.active,
      deviceInfo: d.deviceInfo ?? null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      tokenPrefix: d.token.substring(0, 20) + "...",
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          userId,
          devices: sanitizedDevices,
          activeCount: sanitizedDevices.filter((d) => d.active).length,
          totalCount: sanitizedDevices.length,
        },
      },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[v1/devices] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to list devices",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * POST /api/v1/devices
 *
 * Registers or reassigns a device token for push notifications.
 * If the token already exists (even for another user), it's reassigned to the caller.
 *
 * @remarks POST · auth: JWT Bearer token
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.issues },
        { status: 400, headers: corsHeaders() },
      );
    }

    const { token, platform, deviceInfo } = parsed.data;

    // Upsert: reassign token if it exists for another user
    const [device] = await db
      .insert(deviceTokens)
      .values({
        userId,
        token,
        platform,
        active: true,
        updatedAt: new Date(),
        ...(deviceInfo ? { deviceInfo } : {}),
      })
      .onConflictDoUpdate({
        target: deviceTokens.token,
        set: {
          userId,
          platform,
          active: true,
          updatedAt: new Date(),
          ...(deviceInfo ? { deviceInfo } : {}),
        },
      })
      .returning();

    db.update(deviceTokens)
      .set({ active: false })
      .where(and(
        eq(deviceTokens.userId, userId),
        eq(deviceTokens.platform, platform),
        eq(deviceTokens.active, true),
        not(eq(deviceTokens.token, token))
      ))
      .catch(() => {});

    // Stamp User.lastDeviceInfo and lastSeenAt
    if (deviceInfo) {
      db.update(users)
        .set({ lastDeviceInfo: deviceInfo, lastSeenAt: new Date() })
        .where(eq(users.id, userId))
        .catch(() => {});
    }

    // Immediately verify: count active devices for this user
    const activeDeviceRows = await db.query.deviceTokens.findMany({
      where: and(eq(deviceTokens.userId, userId), eq(deviceTokens.active, true)),
      columns: { id: true },
    });
    const activeCount = activeDeviceRows.length;

    const tokenPrefix = token.substring(0, 16);
    console.log(
      `[v1/devices] POST OK`,
      JSON.stringify({
        userId,
        platform,
        tokenPrefix,
        deviceId: device.id,
        active: device.active,
        activeCount,
      }),
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: device.id,
          platform,
          active: device.active,
          activeCount,
          message: `Device registered ✓ — You now have ${activeCount} active device(s)`,
        },
      },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[v1/devices] POST error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to register device",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}

/**
 * DELETE /api/v1/devices
 *
 * Soft-deletes a device token (marks as inactive).
 * Used on logout to stop receiving push notifications.
 *
 * @remarks DELETE · auth: JWT Bearer token
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401, headers: corsHeaders() },
      );
    }

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.issues },
        { status: 400, headers: corsHeaders() },
      );
    }

    const { token } = parsed.data;

    // Only allow deactivating own tokens
    await db
      .update(deviceTokens)
      .set({ active: false })
      .where(and(eq(deviceTokens.token, token), eq(deviceTokens.userId, userId)));

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("[v1/devices] DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to unregister device",
      },
      { status: 500, headers: corsHeaders() },
    );
  }
}
