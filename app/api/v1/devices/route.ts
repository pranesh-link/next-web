import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import prisma from "@/_lib/prisma";
import { z } from "zod/v4";

const registerSchema = z.object({
  token: z.string().min(1).max(256),
  platform: z.enum(["android", "ios", "web"]),
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

    const devices = await prisma.deviceToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        platform: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        token: true,
      },
    });

    const sanitizedDevices = devices.map((d) => ({
      id: d.id,
      platform: d.platform,
      active: d.active,
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

    const { token, platform } = parsed.data;

    // Upsert: reassign token if it exists for another user
    const device = await prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, active: true, updatedAt: new Date() },
      create: { userId, token, platform, active: true },
    });

    // Immediately verify: count active devices for this user
    const activeCount = await prisma.deviceToken.count({
      where: { userId, active: true },
    });

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
          userId,
          platform,
          active: device.active,
          tokenPrefix,
          activeCount,
          message: `Device registered ✓ [userId: ${userId.substring(0, 8)}...] — You now have ${activeCount} active device(s)`,
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
    await prisma.deviceToken.updateMany({
      where: { token, userId },
      data: { active: false },
    });

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
