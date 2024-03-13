"use client";

import { AppProvider } from "@/_store/app/context";
import { IAppContext } from "@/_store/app/types";
import { ReactNode } from "react";

export function AppProviderClient({
  children,
  value,
}: {
  children: ReactNode;
  value: IAppContext;
}) {
  return <AppProvider value={value}>{children}</AppProvider>;
}
