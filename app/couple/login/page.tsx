import { redirect } from "next/navigation";
import { auth } from "@/_lib/auth";
import LoginCard from "@/couple/_components/auth/LoginCard";

export default async function FinanceLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();

  if (session?.user) {
    redirect("/couple/finance");
  }

  const { callbackUrl } = await searchParams;
  // Only allow internal couple paths as callback
  const safeCallback =
    callbackUrl?.startsWith("/couple") ? callbackUrl : "/couple/finance";

  return <LoginCard callbackUrl={safeCallback} />;
}
