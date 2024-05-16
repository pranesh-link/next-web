"use client";

import { useAppSelector } from "@/_redux/hooks";
import React from "react";
import { PageContainer } from "./Elements";

function PageWrapper({ children }: { children: React.ReactNode }) {
  const pwaOffsetState = useAppSelector((state) => state.app.pwaOffset);
  return <PageContainer $paddingTop={pwaOffsetState}>{children}</PageContainer>;
}

export default PageWrapper;
