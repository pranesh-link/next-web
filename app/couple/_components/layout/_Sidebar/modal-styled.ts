"use client";

import styled from "styled-components";
import { EASING } from "./styled";

/** Modal backdrop with blur. */
export const ModalOverlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  opacity: ${(p) => (p.$open ? 1 : 0)};
  pointer-events: ${(p) => (p.$open ? "auto" : "none")};
  transition: opacity 0.2s ${EASING};
`;

/** Centered modal card. */
export const ModalCard = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  width: 340px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

/** Round red icon at the top of the modal. */
export const ModalIcon = styled.div`
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;

  svg {
    width: 24px;
    height: 24px;
  }
`;

/** Modal title. */
export const ModalTitle = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px;
`;

/** Modal description. */
export const ModalDesc = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 24px;
  line-height: 1.5;
`;

/** Modal action button row. */
export const ModalActions = styled.div`
  display: flex;
  gap: 10px;
`;

/** Modal action button; pass `$danger` for the destructive variant. */
export const ModalBtn = styled.button<{ $danger?: boolean }>`
  flex: 1;
  padding: 10px 0;
  border-radius: 10px;
  border: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ${EASING};

  background: ${(p) => (p.$danger ? "#ef4444" : "var(--surface)")};
  color: ${(p) => (p.$danger ? "#fff" : "var(--text)")};

  &:hover {
    background: ${(p) => (p.$danger ? "#dc2626" : "var(--surface-hover)")};
  }
`;
