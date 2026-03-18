import { auth } from "@/_lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import StyledComponentsRegistry from "@/_lib/registry";
import FinanceLayout from "@/finance/_components/layout/FinanceLayout";

export const metadata = {
  title: "Coupletastic",
  description: "Manage your finances together",
};

export default async function FinanceRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Redirect unauthenticated users to login (except the login page itself)
  if (!session?.user && !pathname.startsWith("/finance/login")) {
    redirect("/finance/login");
  }

  const user = session?.user
    ? {
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
        email: session.user.email ?? "",
      }
    : null;

  return (
    <StyledComponentsRegistry>
      <FinanceLayout user={user}>{children}</FinanceLayout>
    </StyledComponentsRegistry>
  );
}
