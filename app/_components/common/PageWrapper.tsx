"use client";

import useIsOnline from "@/_hooks/use-is-online";
import React, { useEffect } from "react";
import { PageContainer } from "./Elements";

function PageWrapper({ children }: { children: React.ReactNode }) {
  const online = useIsOnline();
  useEffect(() => {
    online
      ? document.body.classList.remove("prevent-refresh")
      : document.body.classList.add("prevent-refresh");
  }, [online]);
  return <PageContainer>{children}</PageContainer>;
}

export default PageWrapper;
