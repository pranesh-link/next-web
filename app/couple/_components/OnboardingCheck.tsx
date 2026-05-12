"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const ONBOARDING_KEY = "coupletastic_onboarded";

interface OnboardingCheckProps {
  /** Whether the current user belongs to an active couple. */
  hasCouple: boolean;
}

/**
 * Client component that redirects to `/couple/onboarding` when the user
 * has a couple but has not yet completed the onboarding flow.
 *
 * The check runs client-side so it can read from localStorage.
 * Renders nothing — purely a side-effect component.
 *
 * @param hasCouple - True when the user has an active CoupleMember record.
 * @returns null
 */
export default function OnboardingCheck({ hasCouple }: OnboardingCheckProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hasCouple) return;
    if (pathname?.startsWith("/couple/onboarding")) return;
    if (pathname?.startsWith("/couple/invite")) return;

    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      router.replace("/couple/onboarding");
    }
  }, [hasCouple, pathname, router]);

  return null;
}
