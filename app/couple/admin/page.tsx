import { auth } from "@/_lib/auth";
import { redirect } from "next/navigation";
import { db } from "@db";
import {
  users,
  couples,
  coupleMessages,
  transactions,
  loans,
  financialAccounts,
  deviceTokens,
  appErrors,
} from "@db/schema";
import { eq, gte, and, count, desc, inArray, sql } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "prans1991@gmail.com";

async function getStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
    recentErrors,
    [{ count: errors24h }],
    [{ count: errors7d }],
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
    db
      .select({
        id: appErrors.id,
        userId: appErrors.userId,
        route: appErrors.route,
        method: appErrors.method,
        statusCode: appErrors.statusCode,
        message: appErrors.message,
        platform: appErrors.platform,
        appVersion: appErrors.appVersion,
        createdAt: appErrors.createdAt,
      })
      .from(appErrors)
      .orderBy(desc(appErrors.createdAt))
      .limit(50),
    db.select({ count: count() }).from(appErrors).where(gte(appErrors.createdAt, oneDayAgo)),
    db.select({ count: count() }).from(appErrors).where(gte(appErrors.createdAt, sevenDaysAgo)),
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
          .where(and(inArray(deviceTokens.userId, recentUserIds), eq(deviceTokens.active, true)))
          .orderBy(desc(deviceTokens.updatedAt))
      : [];

  const latestDeviceMap = new Map<string, { platform: string; deviceInfo: string | null; updatedAt: Date }>();
  for (const token of allActiveTokens) {
    if (!latestDeviceMap.has(token.userId)) {
      latestDeviceMap.set(token.userId, { platform: token.platform, deviceInfo: token.deviceInfo ?? null, updatedAt: token.updatedAt });
    }
  }

  return {
    overview: { totalUsers, activeUsers7d, totalCouples, totalMessages, messages7d, totalTransactions, totalLoans, totalAccounts },
    push: { activeDevices, expiredDevices, byPlatform: devicesByPlatform },
    users: recentUsers.map((u) => ({
      ...u,
      deviceTokens: latestDeviceMap.has(u.id)
        ? [latestDeviceMap.get(u.id)!]
        : [],
    })),
    errors: { recent: recentErrors, count24h: errors24h, count7d: errors7d },
  };
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ background: "var(--admin-card-bg)", border: "1px solid var(--admin-border)", borderRadius: 12, padding: "16px 20px", minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "var(--admin-label)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--admin-text)", letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--admin-label)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function fmt(d: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  const diff = Date.now() - dt.getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function AdminDashboard() {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/couple");

  const stats = await getStats();

  return (
    <>
      <style>{`
        .admin-root {
          --admin-bg: #ffffff;
          --admin-card-bg: #f8f8fc;
          --admin-border: #e2e2ee;
          --admin-text: #111122;
          --admin-text-dim: #333355;
          --admin-label: #6666aa;
          --admin-muted: #9999bb;
          --admin-accent: #6366f1;
          --admin-table-head-bg: #f0f0f8;
          --admin-table-row-even: #f8f8fc;
          --admin-table-row-odd: #ffffff;
          --admin-table-border: #e8e8f0;
          --admin-green: #059669;
          --admin-red: #dc2626;
          --admin-amber: #d97706;
          --admin-mono: #4f4f8f;
        }
        @media (prefers-color-scheme: dark) {
          .admin-root {
            --admin-bg: #09090f;
            --admin-card-bg: #0f0f1a;
            --admin-border: #1e1e2e;
            --admin-text: #e8e8ff;
            --admin-text-dim: #c0c0e0;
            --admin-label: #7070b0;
            --admin-muted: #505080;
            --admin-accent: #818cf8;
            --admin-table-head-bg: #0a0a14;
            --admin-table-row-even: #0f0f1a;
            --admin-table-row-odd: #09090f;
            --admin-table-border: #1a1a2a;
            --admin-green: #34d399;
            --admin-red: #f87171;
            --admin-amber: #fbbf24;
            --admin-mono: #9090c8;
          }
        }
      `}</style>
    <div className="admin-root" style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", background: "var(--admin-bg)", color: "var(--admin-text)", fontFamily: "Inter, sans-serif", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: "var(--admin-accent)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>LuvVerse</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5, color: "var(--admin-text)" }}>Admin Dashboard</h1>
        <div style={{ fontSize: 12, color: "var(--admin-muted)", marginTop: 4 }}>Signed in as {session.user.email}</div>
      </div>

      {/* Overview cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard label="Total Users" value={stats.overview.totalUsers} />
        <StatCard label="Active (7d)" value={stats.overview.activeUsers7d} sub={`${Math.round(stats.overview.activeUsers7d / Math.max(stats.overview.totalUsers, 1) * 100)}% of users`} />
        <StatCard label="Couples" value={stats.overview.totalCouples} />
        <StatCard label="Messages" value={stats.overview.totalMessages} sub={`+${stats.overview.messages7d} this week`} />
        <StatCard label="Transactions" value={stats.overview.totalTransactions} />
        <StatCard label="Accounts" value={stats.overview.totalAccounts} />
        <StatCard label="Loans" value={stats.overview.totalLoans} />
      </div>

      {/* Push notification health */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-label)", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Push Notification Health</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          <StatCard label="Active Tokens" value={stats.push.activeDevices} />
          <StatCard label="Expired Tokens" value={stats.push.expiredDevices} sub="awaiting re-registration" />
          {stats.push.byPlatform.map((p) => (
            <StatCard key={p.platform} label={p.platform.toUpperCase()} value={p.count} sub="active tokens" />
          ))}
        </div>
      </div>

      {/* Crashlytics link */}
      <div style={{ marginBottom: 28, padding: "14px 18px", background: "var(--admin-card-bg)", border: "1px solid var(--admin-border)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--admin-text)" }}>Mobile Crash Reports</div>
          <div style={{ fontSize: 12, color: "var(--admin-muted)", marginTop: 2 }}>Crash-level detail with userId correlation is in Firebase Crashlytics</div>
        </div>
        <a
          href="https://console.firebase.google.com/project/luvverse-pranaish/crashlytics"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "8px 16px", background: "var(--admin-accent)", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Open Crashlytics →
        </a>
      </div>

      {/* User + Device table */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-label)", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Users — Recent Activity</h2>
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--admin-border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--admin-table-head-bg)" }}>
                {["Email", "Name", "Last Seen", "Device Info", "Joined"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--admin-label)", fontWeight: 600, letterSpacing: 1, borderBottom: "1px solid var(--admin-border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.users.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? "var(--admin-table-row-even)" : "var(--admin-table-row-odd)" }}>
                  <td style={{ padding: "9px 14px", color: "var(--admin-text)", borderBottom: "1px solid var(--admin-table-border)" }}>{u.email}</td>
                  <td style={{ padding: "9px 14px", color: "var(--admin-text-dim)", borderBottom: "1px solid var(--admin-table-border)" }}>{u.name ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: u.lastSeenAt ? "var(--admin-green)" : "var(--admin-muted)", borderBottom: "1px solid var(--admin-table-border)", whiteSpace: "nowrap" }}>
                    {fmt(u.lastSeenAt)}
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--admin-text-dim)", borderBottom: "1px solid var(--admin-table-border)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.deviceTokens[0]?.deviceInfo ?? u.lastDeviceInfo ?? "—"}
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--admin-muted)", borderBottom: "1px solid var(--admin-table-border)", whiteSpace: "nowrap" }}>
                    {fmt(u.createdAt)}
                  </td>
                </tr>
              ))}
              {stats.users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--admin-muted)" }}>No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Log */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--admin-label)", letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>API Error Log</h2>
          <span style={{ fontSize: 11, color: "var(--admin-muted)" }}>{stats.errors.count24h} in 24h · {stats.errors.count7d} in 7d</span>
        </div>
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid var(--admin-border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "var(--admin-table-head-bg)" }}>
                {["Time", "Status", "Method", "Route", "Platform", "Version", "Message"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--admin-label)", fontWeight: 600, letterSpacing: 1, borderBottom: "1px solid var(--admin-border)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.errors.recent.map((e, i) => {
                const statusColor = e.statusCode >= 500 ? "var(--admin-red)" : e.statusCode >= 400 ? "var(--admin-amber)" : "var(--admin-muted)";
                return (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? "var(--admin-table-row-even)" : "var(--admin-table-row-odd)" }}>
                    <td style={{ padding: "9px 14px", color: "var(--admin-muted)", borderBottom: "1px solid var(--admin-table-border)", whiteSpace: "nowrap" }}>{fmt(e.createdAt)}</td>
                    <td style={{ padding: "9px 14px", fontWeight: 700, color: statusColor, borderBottom: "1px solid var(--admin-table-border)" }}>{e.statusCode}</td>
                    <td style={{ padding: "9px 14px", color: "var(--admin-mono)", borderBottom: "1px solid var(--admin-table-border)", fontFamily: "monospace" }}>{e.method}</td>
                    <td style={{ padding: "9px 14px", color: "var(--admin-text)", borderBottom: "1px solid var(--admin-table-border)", fontFamily: "monospace", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.route}>{e.route}</td>
                    <td style={{ padding: "9px 14px", color: "var(--admin-text-dim)", borderBottom: "1px solid var(--admin-table-border)" }}>{e.platform ?? "—"}</td>
                    <td style={{ padding: "9px 14px", color: "var(--admin-text-dim)", borderBottom: "1px solid var(--admin-table-border)" }}>{e.appVersion ?? "—"}</td>
                    <td style={{ padding: "9px 14px", color: "var(--admin-text-dim)", borderBottom: "1px solid var(--admin-table-border)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.message}>{e.message}</td>
                  </tr>
                );
              })}
              {stats.errors.recent.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "var(--admin-muted)" }}>No errors logged yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}
