"use client";

import Link from "next/link";
import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

/** Easing curve shared across sidebar transitions. */
export { EASING } from "@/couple/_constants/theme";

/** Mobile dim overlay shown when the drawer is open. */
export const Overlay = styled.div<{ $open: boolean }>`
  display: none;
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 30;
    background: rgba(0, 0, 0, 0.6);
    opacity: ${(p) => (p.$open ? 1 : 0)};
    pointer-events: ${(p) => (p.$open ? "auto" : "none")};
    transition: opacity 0.3s ${EASING};
  }
`;

/** Floating hamburger button visible only on small screens. */
export const HamburgerButton = styled.button`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    left: 16px;
    /* center vertically inside the 64px header band */
    top: 8px;
    z-index: 50;
    width: 48px;
    height: 48px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 12px;
    backdrop-filter: blur(12px);
    color: var(--text);
    cursor: pointer;
    transition: all 0.3s ${EASING};

    &:hover {
      background: var(--surface-hover);
    }

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

/** Sidebar shell; collapses to 64px on desktop and slides off on mobile. */
export const SidebarWrapper = styled.aside<{ $expanded: boolean }>`
  position: fixed;
  left: 0;
  top: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: ${(p) => (p.$expanded ? "256px" : "64px")};
  background: var(--bg-elevated);
  border-right: 1px solid var(--border);
  backdrop-filter: blur(20px);
  transition: width 0.3s ${EASING};
  overflow: hidden;

  @media (max-width: 768px) {
    width: 256px;
    transform: translateX(${(p) => (p.$expanded ? "0" : "-100%")});
    transition: transform 0.3s ${EASING};
  }
`;

/** Header band containing the brand mark. */
export const LogoArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;

  @media (max-width: 768px) {
    /* 16px left gap + 48px hamburger + 12px gap = 76px — logo text aligns with header title */
    padding: 0 16px 0 76px;
  }
`;

/** Square accent logo tile. */
export const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: var(--accent);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
`;

/** Brand wordmark; fades with sidebar expansion. */
export const LogoText = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.3px;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;

/** Vertical nav list; can be visually disabled while signing out. */
export const Nav = styled.nav<{ $disabled?: boolean }>`
  flex: 1;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  ${(p) => p.$disabled && `pointer-events: none; opacity: 0.5;`}
`;

/** Single nav row; highlighted via `$active`. */
export const NavLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ${EASING};
  border-left: 3px solid
    ${(p) => (p.$active ? "var(--accent)" : "transparent")};
  background: ${(p) => (p.$active ? "rgba(59, 130, 246, 0.1)" : "transparent")};
  color: ${(p) => (p.$active ? "var(--accent-light)" : "var(--text-dim)")};

  &:hover {
    color: ${(p) => (p.$active ? "var(--accent-light)" : "var(--text)")};
    background: ${(p) =>
      p.$active ? "rgba(59, 130, 246, 0.1)" : "var(--surface)"};
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

/** Nav-link label that fades with sidebar collapse. */
export const NavLinkLabel = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;

/** Footer area containing user info and sign-out. */
export const BottomSection = styled.div`
  border-top: 1px solid var(--border);
  padding: 12px;
  flex-shrink: 0;
`;

/** Theme toggle button (currently hidden — light mode forced). */
export const ThemeToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ${EASING};

  &:hover {
    background: var(--surface);
    color: var(--text);
  }

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

/** Theme toggle label that fades with sidebar collapse. */
export const ThemeToggleLabel = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;

/** Hidden variant of {@link ThemeToggle} — kept in DOM for a11y/markup parity. */
export const HiddenThemeToggle = styled(ThemeToggle)`
  display: none;
`;
