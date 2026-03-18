import { redirect } from "next/navigation";
import { auth } from "@/_lib/auth";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/api/auth/signin");
  }

  return user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}

export async function requireAuthForAction() {
  const user = await getCurrentUser();
  if (!user?.id) return null;
  return user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}
