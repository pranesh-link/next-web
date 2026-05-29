import { NextResponse } from "next/server";
import { auth } from "@/_lib/auth";
import { prisma } from "@/_lib/prisma";

/**
 * Temporary diagnostic endpoint.
 * Visit /api/debug/session to see session userId and DB record counts.
 * Remove this file once the empty-data issue is diagnosed.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = session.user.id;

  const [accountCount, loanCount, coupleMember, userRecord] = await Promise.all([
    prisma.financialAccount.count({ where: { userId } }),
    prisma.loan.count({ where: { userId } }),
    prisma.coupleMember.findFirst({
      where: { userId },
      include: { couple: { include: { members: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true } }),
  ]);

  return NextResponse.json({
    sessionUserId: userId,
    userRecord,
    accountCount,
    loanCount,
    coupleId: coupleMember?.coupleId ?? null,
    coupleMembers: coupleMember?.couple?.members?.map((m) => m.userId) ?? [],
    hint: accountCount === 0
      ? "No accounts found for this userId — data may be stored under a different userId"
      : "Accounts found — data is accessible",
  });
}
