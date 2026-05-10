import type { CoupleInvite } from "./_types";

/**
 * Build the public invite link for an invite token. Honors NEXT_PUBLIC_BASE_URL
 * when set; otherwise falls back to the current window origin (client only).
 */
export function buildInviteLink(invite: CoupleInvite): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  const token = (invite as CoupleInvite & { token: string }).token;
  return `${baseUrl}/finance/invite/${token}`;
}
