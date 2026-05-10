"use client";

import { signOut } from "next-auth/react";
import {
  ModalActions,
  ModalBtn,
  ModalCard,
  ModalDesc,
  ModalIcon,
  ModalOverlay,
  ModalTitle,
} from "./modal-styled";

/** Props for {@link SignOutModal}. */
interface SignOutModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Whether a sign-out request is in flight. */
  signingOut: boolean;
  /** Called when the user dismisses the modal. */
  onCancel: () => void;
  /** Called when the user confirms the sign-out (after starting the request). */
  onConfirm: () => void;
}

/**
 * Confirmation dialog shown before signing the user out.
 *
 * @param props - See {@link SignOutModalProps}.
 * @remarks On confirm, fires `onConfirm` then calls
 * `next-auth/react`'s `signOut({ callbackUrl: "/couple/login" })`.
 */
export function SignOutModal({
  open,
  signingOut,
  onCancel,
  onConfirm,
}: SignOutModalProps) {
  return (
    <ModalOverlay $open={open} onClick={() => !signingOut && onCancel()}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ModalIcon>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </ModalIcon>
        <ModalTitle>Sign out?</ModalTitle>
        <ModalDesc>
          You&apos;ll need to sign in again to access your account.
        </ModalDesc>
        <ModalActions>
          <ModalBtn type="button" disabled={signingOut} onClick={onCancel}>
            Cancel
          </ModalBtn>
          <ModalBtn
            type="button"
            $danger
            disabled={signingOut}
            onClick={() => {
              onConfirm();
              signOut({ callbackUrl: "/couple/login" });
            }}
          >
            {signingOut ? "Signing out\u2026" : "Sign Out"}
          </ModalBtn>
        </ModalActions>
      </ModalCard>
    </ModalOverlay>
  );
}
