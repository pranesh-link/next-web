"use client";

import useIsOnline from "@/_hooks/use-is-online";
import { useAppSelector } from "@/_redux/hooks";
import React, { useEffect } from "react";
import { PageContainer } from "./Elements";

function PageWrapper({ children }: { children: React.ReactNode }) {
  const pwaOffsetState = useAppSelector((state) => state.app.pwaOffset);
  const online = useIsOnline();
  useEffect(() => {
    online
      ? document.body.classList.remove("prevent-refresh")
      : document.body.classList.add("prevent-refresh");
  }, [online]);
  return <PageContainer $paddingTop={pwaOffsetState}>{children}</PageContainer>;
}

export default PageWrapper;
