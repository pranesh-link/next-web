"use client";

import useIsMobile from "@/_hooks/use-mobile-detect";
import { usePathname } from "next/navigation";
import RedirectLink from "./RedirectLink";

export default function GoToHome() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (pathname !== "/" &&
    pathname !== "/maintenance" &&
    pathname !== "/profile" &&
    pathname !== "/profile-2.0" &&
    pathname !== "/admin") ||
    (pathname === "/profile" && isMobile) ? (
    <RedirectLink offset={0} route="/" label="Home" />
  ) : null;
}
