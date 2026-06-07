import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import prisma from "@/_lib/prisma";

export function OPTIONS() {
  return handleOptions();
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "prans1991@gmail.com";

/**
 * GET /api/v1/admin/stats
 *
 * Returns aggregated platform telemetry for the admin dashboard.
 * Restricted to the configured ADMIN_EMAIL account.
 *
 * @remarks GET · auth: admin JWT Bearer token
 */
export async function GET() {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401, headers: corsHeaders() });
    }

    // Verify admin email
    const requestUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (requestUser?.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders() });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers7d,
      totalCouples,
      totalMessages,
      messages7d,
      totalTransactions,
      totalLoans,
      totalAccounts,
      activeDevices,
      expiredDevices,
      devicesByPlatform,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastSeenAt: { gte: sevenDaysAgo } } }),
      prisma.couple.count(),
      prisma.coupleMessage.count(),
      prisma.coupleMessage.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.transaction.count(),
      prisma.loan.count(),
      prisma.financialAccount.count(),
      prisma.deviceToken.count({ where: { active: true } }),
      prisma.deviceToken.count({ where: { active: false } }),
      prisma.deviceToken.groupBy({
        by: ["platform"],
        where: { active: true },
        _count: true,
      }),
      prisma.user.findMany({
        orderBy: { lastSeenAt: { sort: "desc", nulls: "last" } },
        take: 50,
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          lastSeenAt: true,
          lastDeviceInfo: true,
          deviceTokens: {
            where: { active: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: { platform: true, deviceInfo: true, updatedAt: true },
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          overview: {
            totalUsers,
            activeUsers7d,
            totalCouples,
            totalMessages,
            messages7d,
            totalTransactions,
            totalLoans,
            totalAccounts,
          },
          push: {
            activeDevices,
            expiredDevices,
            byPlatform: devicesByPlatform.map((g) => ({
              platform: g.platform,
              count: g._count,
            })),
          },
          users: recentUsers.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            createdAt: u.createdAt.toISOString(),
            lastSeenAt: u.lastSeenAt?.toISOString() ?? null,
            lastDeviceInfo: u.lastDeviceInfo ?? null,
            latestDevice: u.deviceTokens[0]
              ? {
                  platform: u.deviceTokens[0].platform,
                  deviceInfo: u.deviceTokens[0].deviceInfo ?? null,
                  lastRegistered: u.deviceTokens[0].updatedAt.toISOString(),
                }
              : null,
          })),
        },
      },
      { headers: corsHeaders("private, no-store") },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch stats" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
