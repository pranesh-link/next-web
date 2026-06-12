import { NextResponse } from "next/server";
import { getAuthUserId } from "@/api/v1/_lib/auth";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";
import { db } from "@db";
import { users, couples, coupleMessages, transactions, loans, financialAccounts, deviceTokens } from "@db/schema";
import { eq, gte, and, count, desc, inArray, sql } from "drizzle-orm";

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
    const requestUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { email: true },
    });
    if (requestUser?.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: corsHeaders() });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      [{ count: totalUsers }],
      [{ count: activeUsers7d }],
      [{ count: totalCouples }],
      [{ count: totalMessages }],
      [{ count: messages7d }],
      [{ count: totalTransactions }],
      [{ count: totalLoans }],
      [{ count: totalAccounts }],
      [{ count: activeDevices }],
      [{ count: expiredDevices }],
      devicesByPlatform,
      recentUsers,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(gte(users.lastSeenAt, sevenDaysAgo)),
      db.select({ count: count() }).from(couples),
      db.select({ count: count() }).from(coupleMessages),
      db.select({ count: count() }).from(coupleMessages).where(gte(coupleMessages.createdAt, sevenDaysAgo)),
      db.select({ count: count() }).from(transactions),
      db.select({ count: count() }).from(loans),
      db.select({ count: count() }).from(financialAccounts),
      db.select({ count: count() }).from(deviceTokens).where(eq(deviceTokens.active, true)),
      db.select({ count: count() }).from(deviceTokens).where(eq(deviceTokens.active, false)),
      db
        .select({ platform: deviceTokens.platform, count: count() })
        .from(deviceTokens)
        .where(eq(deviceTokens.active, true))
        .groupBy(deviceTokens.platform),
      db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          createdAt: users.createdAt,
          lastSeenAt: users.lastSeenAt,
          lastDeviceInfo: users.lastDeviceInfo,
        })
        .from(users)
        .orderBy(sql`${users.lastSeenAt} DESC NULLS LAST`)
        .limit(50),
    ]);

    // Fetch latest active device token per recent user
    const recentUserIds = recentUsers.map((u) => u.id);
    const allActiveTokens =
      recentUserIds.length > 0
        ? await db
            .select({
              userId: deviceTokens.userId,
              platform: deviceTokens.platform,
              deviceInfo: deviceTokens.deviceInfo,
              updatedAt: deviceTokens.updatedAt,
            })
            .from(deviceTokens)
            .where(
              and(
                inArray(deviceTokens.userId, recentUserIds),
                eq(deviceTokens.active, true),
              ),
            )
            .orderBy(desc(deviceTokens.updatedAt))
        : [];

    const latestDeviceMap = new Map<
      string,
      { platform: string; deviceInfo: string | null; updatedAt: Date }
    >();
    for (const token of allActiveTokens) {
      if (!latestDeviceMap.has(token.userId)) {
        latestDeviceMap.set(token.userId, {
          platform: token.platform,
          deviceInfo: token.deviceInfo ?? null,
          updatedAt: token.updatedAt,
        });
      }
    }

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
              count: g.count,
            })),
          },
          users: recentUsers.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            createdAt: String(u.createdAt),
            lastSeenAt: u.lastSeenAt ? String(u.lastSeenAt) : null,
            lastDeviceInfo: u.lastDeviceInfo ?? null,
            latestDevice: latestDeviceMap.has(u.id)
              ? {
                  platform: latestDeviceMap.get(u.id)!.platform,
                  deviceInfo: latestDeviceMap.get(u.id)!.deviceInfo,
                  lastRegistered: String(latestDeviceMap.get(u.id)!.updatedAt),
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
