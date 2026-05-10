"use client";

import styled from "styled-components";

export type LastUpdatedBadgeProps = {
  /** Display name of the user who last updated. */
  name?: string | null;
  /** Email of the user (used to derive a fallback handle). */
  email?: string | null;
  /** ID of the user who last updated. */
  userId?: string | null;
  /** ID of the currently signed-in user (renders "You" when matches). */
  currentUserId?: string | null;
  /** Timestamp of the last update. */
  updatedAt: Date | string;
  /** Leading label. Defaults to "Last updated by". */
  prefix?: string;
  /** Show the leading check mark. Defaults to true. */
  showCheck?: boolean;
};

function formatRelativeTime(date: Date | string): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  const years = Math.floor(days / 365);
  return `${years} yr${years === 1 ? "" : "s"} ago`;
}

function resolveDisplayName(
  name: string | null | undefined,
  email: string | null | undefined,
  userId: string | null | undefined,
  currentUserId: string | null | undefined,
): string {
  if (userId && currentUserId && userId === currentUserId) return "You";
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const handle = email?.split("@")[0]?.trim();
  if (handle) return handle;
  return "Partner";
}

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: green !important;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
  letter-spacing: 0.2px;
  white-space: nowrap;

  strong {
    color: green !important;
    font-style: italic;
    font-weight: 700;
  }

  @media (max-width: 480px) {
    display: inline-flex;
    margin-left: 0;
    margin-top: 4px;
    font-size: 12px;
  }
`;

export default function LastUpdatedBadge({
  name,
  email,
  userId,
  currentUserId,
  updatedAt,
  prefix = "Last updated by",
  showCheck = true,
}: LastUpdatedBadgeProps) {
  const displayName = resolveDisplayName(name, email, userId, currentUserId);
  const relative = formatRelativeTime(updatedAt);
  return (
    <Pill title={`Last updated ${relative}`}>
      {showCheck ? "✓ " : ""}
      {prefix}{" "}
      <strong>{displayName}</strong>
      {" · "}
      {relative}
    </Pill>
  );
}
