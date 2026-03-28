import { auth } from "@/_lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { SessionProvider } from "next-auth/react";
import StyledComponentsRegistry from "@/_lib/registry";
import CoupleProviders from "@/couple/_components/CoupleProviders";
import FinanceLayout from "@/couple/_components/layout/FinanceLayout";

export const metadata = {
  title: "Coupletastic",
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

  return (
    <SessionProvider session={session}>
      <StyledComponentsRegistry>
        <CoupleProviders>
          <FinanceLayout user={user}>{children}</FinanceLayout>
        </CoupleProviders>
      </StyledComponentsRegistry>
    </SessionProvider>
  );
}
