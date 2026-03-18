import { redirect } from "next/navigation";
import { auth } from "@/_lib/auth";
import LoginCard from "@/finance/_components/auth/LoginCard";

export default async function FinanceLoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/finance");
  }

  return <LoginCard />;
}
