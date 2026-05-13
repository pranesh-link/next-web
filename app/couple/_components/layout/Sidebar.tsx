"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { useFinanceTheme } from "@/couple/_components/theme/FinanceThemeProvider";
import {
  coupleNavItems,
  financeNavItems,
  lifestyleNavItems,
} from "./_Sidebar/nav-items";
import { SignOutModal } from "./_Sidebar/SignOutModal";
import {
  Avatar,
  SignOutButton,
  SignOutButtonLabel,
  UserArea,
  UserEmail,
  UserInfo,
  UserName,
} from "./_Sidebar/footer-styled";
import {
  BottomSection,
  HamburgerButton,
  LogoArea,
  LogoIcon,
  LogoText,
  Nav,
  NavLink,
  NavLinkLabel,
  Overlay,
  SidebarWrapper,
  HiddenThemeToggle,
  ThemeToggleLabel,
} from "./_Sidebar/styled";

/** Authenticated user shown in the sidebar footer. */
interface SidebarUser {
  /** Display name (optional). */
  name?: string;
  /** Avatar image URL (optional). */
  image?: string;
  /** User email; always required when a user is signed in. */
  email: string;
}

/** Props for {@link Sidebar}. */
interface SidebarProps {
  /** Currently signed-in user, or null if anonymous. */
  user: SidebarUser | null;
}

/**
 * Coupletastic-wide sidebar with context-aware navigation.
 *
 * Switches between the couple-level nav (`/couple` routes), the finance-level
 * nav (`/couple/finance/*` routes), and the lifestyle-level nav
 * (`/couple/lifestyle/*` routes) based on the current pathname.
 *
 * @param props - See {@link SidebarProps}.
 */
export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useFinanceTheme();
  const [expanded, setExpanded] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isFinanceRoute = pathname.startsWith("/couple/finance");
  const isLifestyleRoute = pathname.startsWith("/couple/lifestyle");
  const navItems = isLifestyleRoute
    ? lifestyleNavItems
    : isFinanceRoute
      ? financeNavItems
      : coupleNavItems;

  const isActive = useCallback(
    (href: string) => {
      if (href === "/couple") return pathname === "/couple";
      if (href === "/couple/finance") return pathname === "/couple/finance";
      if (href === "/couple/lifestyle") return pathname === "/couple/lifestyle";
      if (href === "/couple/chat") return pathname === "/couple/chat";
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
        onMouseEnter={() => { if (window.matchMedia("(pointer: fine)").matches) setExpanded(true); }}
        onMouseLeave={() => { if (window.matchMedia("(pointer: fine)").matches) setExpanded(false); }}
      >
        <LogoArea>
          <LogoIcon>💑</LogoIcon>
          <LogoText $visible={expanded}>Coupletastic</LogoText>
        </LogoArea>

        <Nav $disabled={signingOut}>
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
              </NavLink>
            );
          })}
        </Nav>

        <BottomSection>
          {/* Theme toggle hidden — light mode forced */}
          <HiddenThemeToggle
            type="button"
            onClick={toggleTheme}
          >
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
          </HiddenThemeToggle>

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

          <SignOutButton
            type="button"
            disabled={signingOut}
            onClick={() => setShowSignOut(true)}
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1-2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <SignOutButtonLabel $visible={expanded}>
              Sign Out
            </SignOutButtonLabel>
          </SignOutButton>
        </BottomSection>
      </SidebarWrapper>

      <SignOutModal
        open={showSignOut}
        signingOut={signingOut}
        onCancel={() => setShowSignOut(false)}
        onConfirm={() => setSigningOut(true)}
      />
    </>
  );
}
