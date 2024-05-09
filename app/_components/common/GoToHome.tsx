"use client";

import { usePathname } from "next/navigation";
import RedirectLink from "./RedirectLink";

export default function GoToHome() {
  const router = usePathname();

  return router !== "/" ? <RedirectLink route="/" label="Home" /> : null;
}
