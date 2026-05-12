"use client";

import Link from "next/link";
import styled from "styled-components";
import { EASING } from "@/couple/_constants/theme";

/* ── Styled Components ── */

const PageWrapper = styled.div`
  min-height: 100vh;
  background: var(--bg);
`;

const Content = styled.main`
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 24px;

  @media (max-width: 768px) {
    padding: 24px 16px;
  }

  @media (max-width: 480px) {
    padding: 20px 12px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 8px;
`;

const SectionSubtitle = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 0 0 28px;
  line-height: 1.5;
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ModuleCard = styled.div<{ $active?: boolean }>`
  position: relative;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid ${(p) => (p.$active ? "var(--accent)" : "var(--border)")};
  background: var(--bg-elevated);
  transition: all 0.2s ${EASING};
  overflow: hidden;

  ${(p) =>
    p.$active
      ? `
    cursor: pointer;
    &:hover {
      border-color: var(--accent);
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
      transform: translateY(-2px);
    }
  `
      : `
    opacity: 0.6;
  `}
`;

const ModuleIcon = styled.div`
  font-size: 32px;
  margin-bottom: 12px;
`;

const ModuleName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 6px;
`;

const ModuleDesc = styled.p`
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
`;

const ComingSoonBadge = styled.span`
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  background: var(--surface);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const PlainLink = styled(Link)`
  text-decoration: none;
`;

/* ── Component ── */

const modules = [
  {
    name: "Finance",
    icon: "💰",
    desc: "Track accounts, transactions, budgets, loans & goals together.",
    href: "/couple/finance",
    active: true,
  },
  {
    name: "Travel",
    icon: "🧳",
    desc: "Plan trips, share itineraries, and split travel expenses.",
    href: "/couple/travel",
    active: true,
  },
  {
    name: "Chat",
    icon: "💬",
    desc: "Private messaging with shared lists and reminders.",
    active: true,
    href: "/couple/chat",
  },
  {
    name: "Location Sharing",
    icon: "📍",
    desc: "Real-time location sharing with your partner.",
    active: false,
  },
];

export default function CoupleDashboard() {
  return (
    <PageWrapper>
      <Content>
        <SectionTitle>Welcome back</SectionTitle>
        <SectionSubtitle>
          Everything you share, all in one place.
        </SectionSubtitle>

        <ModulesGrid>
          {modules.map((mod) =>
            mod.active ? (
              <PlainLink key={mod.name} href={mod.href!}>
                <ModuleCard $active>
                  <ModuleIcon>{mod.icon}</ModuleIcon>
                  <ModuleName>{mod.name}</ModuleName>
                  <ModuleDesc>{mod.desc}</ModuleDesc>
                </ModuleCard>
              </PlainLink>
            ) : (
              <ModuleCard key={mod.name}>
                <ComingSoonBadge>Coming Soon</ComingSoonBadge>
                <ModuleIcon>{mod.icon}</ModuleIcon>
                <ModuleName>{mod.name}</ModuleName>
                <ModuleDesc>{mod.desc}</ModuleDesc>
              </ModuleCard>
            ),
          )}
        </ModulesGrid>
      </Content>
    </PageWrapper>
  );
}
