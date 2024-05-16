"use client";

import { useAppSelector } from "@/_redux/hooks";
import { usePathname } from "next/navigation";
import RedirectLink from "./RedirectLink";

export default function GoToHome() {
  const router = usePathname();
  const pwaOffsetState = useAppSelector((state) => state.app.pwaOffset);

  return router !== "/" ? (
    <RedirectLink offset={pwaOffsetState} route="/" label="Home" />
  ) : null;
}
