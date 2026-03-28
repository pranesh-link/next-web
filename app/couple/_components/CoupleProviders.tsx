"use client";

import { FinanceThemeProvider } from "@/couple/_components/theme/FinanceThemeProvider";
import { NotificationProvider } from "@/couple/_components/notifications/NotificationProvider";
import { useSession } from "next-auth/react";

export default function CoupleProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();

  return (
    <FinanceThemeProvider>
      <NotificationProvider hasUser={!!session?.user}>
        {children}
      </NotificationProvider>
    </FinanceThemeProvider>
  );
}
