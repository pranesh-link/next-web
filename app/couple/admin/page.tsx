import { auth } from "@/_lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/_lib/prisma";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "prans1991@gmail.com";

async function getStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

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
    recentErrors,
    errors24h,
    errors7d,
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
    prisma.deviceToken.groupBy({ by: ["platform"], where: { active: true }, _count: true }),
    prisma.user.findMany({
      orderBy: { lastSeenAt: { sort: "desc", nulls: "last" } },
      take: 50,
      select: {
        id: true, email: true, name: true,
        createdAt: true, lastSeenAt: true, lastDeviceInfo: true,
        deviceTokens: {
          where: { active: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { platform: true, deviceInfo: true, updatedAt: true },
        },
      },
    }),
    prisma.appError.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, userId: true, route: true, method: true, statusCode: true, message: true, platform: true, appVersion: true, createdAt: true },
    }),
    prisma.appError.count({ where: { createdAt: { gte: oneDayAgo } } }),
    prisma.appError.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ]);

  return {
    overview: { totalUsers, activeUsers7d, totalCouples, totalMessages, messages7d, totalTransactions, totalLoans, totalAccounts },
    push: { activeDevices, expiredDevices, byPlatform: devicesByPlatform },
    users: recentUsers,
    errors: { recent: recentErrors, count24h: errors24h, count7d: errors7d },
  };
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ background: "var(--bg-elevated, #0f0f0f)", border: "1px solid #1c1c1c", borderRadius: 12, padding: "16px 20px", minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "#6060a0", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#f0f0ff", letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#6060a0", marginTop: 2 }}>{sub}</div>}
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
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", color: "#f0f0ff", fontFamily: "Inter, sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>LuvVerse</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Admin Dashboard</h1>
        <div style={{ fontSize: 12, color: "#6060a0", marginTop: 4 }}>Signed in as {session.user.email}</div>
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
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9090c0", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Push Notification Health</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          <StatCard label="Active Tokens" value={stats.push.activeDevices} />
          <StatCard label="Expired Tokens" value={stats.push.expiredDevices} sub="awaiting re-registration" />
          {stats.push.byPlatform.map((p) => (
            <StatCard key={p.platform} label={p.platform.toUpperCase()} value={p._count} sub="active tokens" />
          ))}
        </div>
      </div>

      {/* Crashlytics link */}
      <div style={{ marginBottom: 28, padding: "14px 18px", background: "#0f0f0f", border: "1px solid #1c1c1c", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0ff" }}>Mobile Crash Reports</div>
          <div style={{ fontSize: 12, color: "#6060a0", marginTop: 2 }}>Crash-level detail with userId correlation is in Firebase Crashlytics</div>
        </div>
        <a
          href="https://console.firebase.google.com/project/luvverse-pranaish/crashlytics"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "8px 16px", background: "#818cf8", color: "#fff", borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Open Crashlytics →
        </a>
      </div>

      {/* User + Device table */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9090c0", letterSpacing: 2, textTransform: "uppercase", margin: "0 0 12px" }}>Users — Recent Activity</h2>
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #1c1c1c" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#0a0a0a" }}>
                {["Email", "Name", "Last Seen", "Device Info", "Joined"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#6060a0", fontWeight: 600, letterSpacing: 1, borderBottom: "1px solid #1c1c1c", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.users.map((u, i) => (
                <tr key={u.id} style={{ background: i % 2 === 0 ? "#0f0f0f" : "#000" }}>
                  <td style={{ padding: "9px 14px", color: "#f0f0ff", borderBottom: "1px solid #1a1a1a" }}>{u.email}</td>
                  <td style={{ padding: "9px 14px", color: "#9090c0", borderBottom: "1px solid #1a1a1a" }}>{u.name ?? "—"}</td>
                  <td style={{ padding: "9px 14px", color: u.lastSeenAt ? "#34d399" : "#6060a0", borderBottom: "1px solid #1a1a1a", whiteSpace: "nowrap" }}>
                    {fmt(u.lastSeenAt)}
                  </td>
                  <td style={{ padding: "9px 14px", color: "#9090c0", borderBottom: "1px solid #1a1a1a", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.deviceTokens[0]?.deviceInfo ?? u.lastDeviceInfo ?? "—"}
                  </td>
                  <td style={{ padding: "9px 14px", color: "#6060a0", borderBottom: "1px solid #1a1a1a", whiteSpace: "nowrap" }}>
                    {fmt(u.createdAt)}
                  </td>
                </tr>
              ))}
              {stats.users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6060a0" }}>No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Log */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#9090c0", letterSpacing: 2, textTransform: "uppercase", margin: 0 }}>API Error Log</h2>
          <span style={{ fontSize: 11, color: "#6060a0" }}>{stats.errors.count24h} in 24h · {stats.errors.count7d} in 7d</span>
        </div>
        <div style={{ overflowX: "auto", borderRadius: 12, border: "1px solid #1c1c1c" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#0a0a0a" }}>
                {["Time", "Status", "Method", "Route", "Platform", "Version", "Message"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#6060a0", fontWeight: 600, letterSpacing: 1, borderBottom: "1px solid #1c1c1c", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.errors.recent.map((e, i) => {
                const statusColor = e.statusCode >= 500 ? "#f87171" : e.statusCode >= 400 ? "#fbbf24" : "#9090c0";
                return (
                  <tr key={e.id} style={{ background: i % 2 === 0 ? "#0f0f0f" : "#000" }}>
                    <td style={{ padding: "9px 14px", color: "#6060a0", borderBottom: "1px solid #1a1a1a", whiteSpace: "nowrap" }}>{fmt(e.createdAt)}</td>
                    <td style={{ padding: "9px 14px", fontWeight: 700, color: statusColor, borderBottom: "1px solid #1a1a1a" }}>{e.statusCode}</td>
                    <td style={{ padding: "9px 14px", color: "#818cf8", borderBottom: "1px solid #1a1a1a", fontFamily: "monospace" }}>{e.method}</td>
                    <td style={{ padding: "9px 14px", color: "#f0f0ff", borderBottom: "1px solid #1a1a1a", fontFamily: "monospace", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.route}>{e.route}</td>
                    <td style={{ padding: "9px 14px", color: "#9090c0", borderBottom: "1px solid #1a1a1a" }}>{e.platform ?? "—"}</td>
                    <td style={{ padding: "9px 14px", color: "#9090c0", borderBottom: "1px solid #1a1a1a" }}>{e.appVersion ?? "—"}</td>
                    <td style={{ padding: "9px 14px", color: "#9090c0", borderBottom: "1px solid #1a1a1a", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={e.message}>{e.message}</td>
                  </tr>
                );
              })}
              {stats.errors.recent.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#6060a0" }}>No errors logged yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
