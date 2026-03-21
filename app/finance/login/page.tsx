import { redirect } from "next/navigation";
import { auth } from "@/_lib/auth";
import LoginCard from "@/finance/_components/auth/LoginCard";

export default async function FinanceLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();

  if (session?.user) {
    redirect("/finance");
  }

  const { callbackUrl } = await searchParams;
  // Only allow internal finance paths as callback
  const safeCallback =
    callbackUrl?.startsWith("/finance") ? callbackUrl : "/finance";

  return <LoginCard callbackUrl={safeCallback} />;
}
