"use client";

import { useAppSelector } from "@/_redux/hooks";
import { usePathname } from "next/navigation";
import RedirectLink from "./RedirectLink";

export default function GoToHome() {
  const pathname = usePathname();
  const pwaOffsetState = useAppSelector((state) => state.app.pwaOffset);

  return pathname !== "/" && pathname !== "/maintenance" ? (
    <RedirectLink offset={pwaOffsetState} route="/" label="Home" />
  ) : null;
}
