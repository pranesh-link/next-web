"use client";

import styled from "styled-components";
import { EASING } from "./styled";

/** Cluster: avatar + user info. */
export const UserArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
`;

/** Round user avatar (image or initials). */
export const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.15);
  color: var(--accent-light);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/** Container for user name + email; fades with sidebar collapse. */
export const UserInfo = styled.div<{ $visible: boolean }>`
  min-width: 0;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;

/** User display name. */
export const UserName = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** User email address. */
export const UserEmail = styled.p`
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** Sign-out button at the bottom of the sidebar. */
export const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    color: var(--danger);
    background: rgba(239, 68, 68, 0.08);
  }

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

/** Sign-out button label that fades with sidebar collapse. */
export const SignOutButtonLabel = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;
