"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import styled from "styled-components";
import { useFinanceTheme } from "@/finance/_components/theme/FinanceThemeProvider";
import { useNotifications } from "@/finance/_components/notifications/NotificationProvider";

interface SidebarUser {
  name?: string;
  image?: string;
  email: string;
}

interface SidebarProps {
  user: SidebarUser | null;
}

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

const navItems = [
  {
    label: "Dashboard",
    href: "/finance",
    iconPath: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
  },
  {
    label: "Transactions",
    href: "/finance/transactions",
    iconPath: (
      <>
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </>
    ),
  },
  {
    label: "Budgets",
    href: "/finance/budgets",
    iconPath: (
      <>
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
        <path d="M22 12A10 10 0 0 0 12 2v10z" />
      </>
    ),
  },
  {
    label: "Loans",
    href: "/finance/loans",
    iconPath: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </>
    ),
  },
  {
    label: "Goals",
    href: "/finance/goals",
    iconPath: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
  },
  {
    label: "Partner",
    href: "/finance/couple",
    iconPath: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    label: "Notifications",
    href: "/finance/notifications",
    iconPath: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
  },
];

const Overlay = styled.div<{ $open: boolean }>`
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

const HamburgerButton = styled.button`
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

const SidebarWrapper = styled.aside<{ $expanded: boolean }>`
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

const LogoArea = styled.div`
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

const LogoIcon = styled.div`
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

const LogoText = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  font-size: 18px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.3px;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;

const Nav = styled.nav`
  flex: 1;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
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

const NavLinkLabel = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;

const NavBadge = styled.span`
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  margin-left: auto;
`;

const BottomSection = styled.div`
  border-top: 1px solid var(--border);
  padding: 12px;
  flex-shrink: 0;
`;

const ThemeToggle = styled.button`
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

const ThemeToggleLabel = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;

const UserArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
`;

const Avatar = styled.div`
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

const UserInfo = styled.div<{ $visible: boolean }>`
  min-width: 0;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;

const UserName = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserEmail = styled.p`
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SignOutButton = styled.button`
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

const SignOutButtonLabel = styled.span<{ $visible: boolean }>`
  white-space: nowrap;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.2s ${EASING};
`;

/* ── Sign-out confirmation modal ── */

const ModalOverlay = styled.div<{ $open: boolean }>`
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

const ModalCard = styled.div`
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  width: 340px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalIcon = styled.div`
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

const ModalTitle = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px;
`;

const ModalDesc = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  margin: 0 0 24px;
  line-height: 1.5;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ModalBtn = styled.button<{ $danger?: boolean }>`
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

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useFinanceTheme();
  const { unreadCount } = useNotifications();
  const [expanded, setExpanded] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/finance") return pathname === "/finance";
      return pathname.startsWith(href);
    },
    [pathname],
  );

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "?");

  return (
    <>
      <HamburgerButton
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "Close sidebar" : "Open sidebar"}
      >
        {expanded ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </HamburgerButton>

      <Overlay $open={expanded} onClick={() => setExpanded(false)} />

      <SidebarWrapper
        $expanded={expanded}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <LogoArea>
          <LogoIcon>💑</LogoIcon>
          <LogoText $visible={expanded}>Coupletastic</LogoText>
        </LogoArea>

        <Nav>
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <NavLink
                key={item.href}
                href={item.href}
                $active={active}
                onClick={() => setExpanded(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {item.iconPath}
                </svg>
                <NavLinkLabel $visible={expanded}>{item.label}</NavLinkLabel>
                {item.label === "Notifications" && unreadCount > 0 && (
                  <NavBadge>{unreadCount}</NavBadge>
                )}
              </NavLink>
            );
          })}
        </Nav>

        <BottomSection>
          {/* Theme toggle hidden — light mode forced */}
          <ThemeToggle type="button" onClick={toggleTheme} style={{ display: 'none' }}>
            {isDark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            <ThemeToggleLabel $visible={expanded}>
              {isDark ? "Light Mode" : "Dark Mode"}
            </ThemeToggleLabel>
          </ThemeToggle>

          {user && (
            <UserArea>
              <Avatar>
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? user.email}
                    width={32}
                    height={32}
                    unoptimized
                  />
                ) : (
                  initials
                )}
              </Avatar>
              <UserInfo $visible={expanded}>
                {user.name && <UserName>{user.name}</UserName>}
                <UserEmail>{user.email}</UserEmail>
              </UserInfo>
            </UserArea>
          )}

          <SignOutButton type="button" onClick={() => setShowSignOut(true)}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <SignOutButtonLabel $visible={expanded}>Sign Out</SignOutButtonLabel>
          </SignOutButton>
        </BottomSection>
      </SidebarWrapper>

      {/* Sign-out confirmation modal */}
      <ModalOverlay $open={showSignOut} onClick={() => setShowSignOut(false)}>
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
          <ModalDesc>You&apos;ll need to sign in again to access your account.</ModalDesc>
          <ModalActions>
            <ModalBtn type="button" onClick={() => setShowSignOut(false)}>
              Cancel
            </ModalBtn>
            <ModalBtn
              type="button"
              $danger
              onClick={() => signOut({ callbackUrl: "/finance/login" })}
            >
              Sign Out
            </ModalBtn>
          </ModalActions>
        </ModalCard>
      </ModalOverlay>
    </>
  );
}
