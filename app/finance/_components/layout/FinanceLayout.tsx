"use client";

import React from "react";
import styled from "styled-components";
import { FinanceThemeProvider } from "@/finance/_components/theme/FinanceThemeProvider";
import { NotificationProvider } from "@/finance/_components/notifications/NotificationProvider";
import IncomeReminderPopup from "@/finance/_components/notifications/IncomeReminderPopup";
import Sidebar from "@/finance/_components/layout/Sidebar";

interface FinanceLayoutUser {
  name?: string;
  image?: string;
  email: string;
}

interface FinanceLayoutProps {
  children: React.ReactNode;
  user: FinanceLayoutUser | null;
}

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  overflow-x: hidden;
`;

const MainContent = styled.main<{ $hasSidebar: boolean }>`
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  margin-left: ${(p) => (p.$hasSidebar ? "64px" : "0")};
  transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

export default function FinanceLayout({ children, user }: FinanceLayoutProps) {
  return (
    <FinanceThemeProvider>
      <NotificationProvider hasUser={!!user}>
        <LayoutContainer>
          {user && <Sidebar user={user} />}
          <MainContent $hasSidebar={!!user}>{children}</MainContent>
        </LayoutContainer>
        <IncomeReminderPopup />
      </NotificationProvider>
    </FinanceThemeProvider>
  );
}
