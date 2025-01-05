"use client";

import useIsMobile from "@/_hooks/use-mobile-detect";
import { useAppSelector } from "@/_redux/hooks";
import { usePathname } from "next/navigation";
import RedirectLink from "./RedirectLink";

export default function GoToHome() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const pwaOffsetState = useAppSelector((state) => state.app.pwaOffset);

  return (pathname !== "/" &&
    pathname !== "/maintenance" &&
    pathname !== "/profile") ||
    (pathname === "/profile" && isMobile) ? (
    <RedirectLink offset={pwaOffsetState} route="/" label="Home" />
  ) : null;
}
