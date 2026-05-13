"use client";

import React from "react";
import styled from "styled-components";
import Sidebar from "@/couple/_components/layout/Sidebar";

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
  height: 100dvh;
  overflow: hidden;
`;

const MainContent = styled.main<{ $hasSidebar: boolean }>`
  flex: 1;
  min-width: 0;
  height: 100dvh;
  overflow: hidden;
  margin-left: ${(p) => (p.$hasSidebar ? "64px" : "0")};
  transition: margin-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

export default function FinanceLayout({ children, user }: FinanceLayoutProps) {
  return (
    <LayoutContainer>
      {user && <Sidebar user={user} />}
      <MainContent $hasSidebar={!!user}>{children}</MainContent>
    </LayoutContainer>
  );
}
