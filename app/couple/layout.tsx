import { auth } from "@/_lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SessionProvider } from "next-auth/react";
import StyledComponentsRegistry from "@/_lib/registry";
import CoupleProviders from "@/couple/_components/CoupleProviders";
import FinanceLayout from "@/couple/_components/layout/FinanceLayout";
import OnboardingCheck from "@/couple/_components/OnboardingCheck";
import { db } from "@db";
import { coupleMembers } from "@db/schema";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "LuvVerse",
  description: "Your shared space for everything together",
};

export default async function CoupleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const hasCouple = session?.user?.id
    ? !!(await db.query.coupleMembers.findFirst({
        where: eq(coupleMembers.userId, session.user.id),
        columns: { id: true },
      }))
    : false;

  // Redirect unauthenticated users to login (except the login page itself)
  if (!session?.user && !pathname.startsWith("/couple/login")) {
    const loginUrl =
      pathname && pathname !== "/couple/login"
        ? `/couple/login?callbackUrl=${encodeURIComponent(pathname)}`
        : "/couple/login";
    redirect(loginUrl);
  }

  const user = session?.user
    ? {
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
        email: session.user.email ?? "",
      }
    : null;

  const isAdmin = session?.user?.email === (process.env.ADMIN_EMAIL ?? "prans1991@gmail.com");

  return (
    <SessionProvider session={session}>
      <StyledComponentsRegistry>
        <CoupleProviders>
          <OnboardingCheck hasCouple={hasCouple} />
          <FinanceLayout user={user} isAdmin={isAdmin}>{children}</FinanceLayout>
        </CoupleProviders>
      </StyledComponentsRegistry>
    </SessionProvider>
  );
}
