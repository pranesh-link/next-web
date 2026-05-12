"use client";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { ProfileProvider } from "@/_store/profile/page/context";
import { IProfileContext } from "@/_store/profile/types";
import { ThemeProvider, useTheme } from "./shared/ThemeContext";
import ThemeToggle from "./shared/ThemeToggle";
import DarkNavigation from "./navigation/Navigation";
import DarkMobileMenu from "./navigation/MobileMenu";
import InterestNav from "./navigation/InterestNav";
import SectionPrompt from "./shared/SectionPrompt";
import DarkHeroSection from "./sections/HeroSection";
import DarkStatsSection from "./sections/StatsSection";
import DarkAboutSection from "./sections/AboutSection";
import DarkSkillsSection from "./sections/SkillsSection";
import DarkExperienceSection from "./sections/ExperienceSection";
import DarkEducationSection from "./sections/EducationSection";
import DarkOpenSourceSection from "./sections/OpenSourceSection";
import DarkContactSection from "./sections/ContactSection";
import SectionDivider from "./shared/SectionDivider";

const DarkGlobalStyle = createGlobalStyle<{ $isDark: boolean }>`
  :root {
    --bg: ${(p) => (p.$isDark ? "#0a0a0a" : "#f8fafc")};
    --bg-elevated: ${(p) => (p.$isDark ? "#111111" : "#ffffff")};
    --surface: ${(p) =>
      p.$isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)"};
    --surface-hover: ${(p) =>
      p.$isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.05)"};
    --border: ${(p) =>
      p.$isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"};
    --border-strong: ${(p) =>
      p.$isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"};
    --text: ${(p) => (p.$isDark ? "#e5e5e5" : "#1a1a2e")};
    --text-dim: ${(p) => (p.$isDark ? "#a1a1aa" : "#52525b")};
    --text-muted: ${(p) => (p.$isDark ? "#71717a" : "#94a3b8")};
    --nav-bg: ${(p) =>
      p.$isDark ? "rgba(10, 10, 10, 0.95)" : "rgba(255, 255, 255, 0.92)"};
    --nav-bg-clear: ${(p) =>
      p.$isDark ? "rgba(10, 10, 10, 0.6)" : "rgba(255, 255, 255, 0.5)"};
    --accent: #3b82f6;
    --accent-light: ${(p) => (p.$isDark ? "#60a5fa" : "#3b82f6")};
    --accent-lighter: ${(p) => (p.$isDark ? "#93c5fd" : "#2563eb")};
    --particle-dot: ${(p) =>
      p.$isDark
        ? "rgba(59, 130, 246, 0.15)"
        : "rgba(59, 130, 246, 0.12)"};
    --gradient-mouse: ${(p) =>
      p.$isDark
        ? "rgba(59, 130, 246, 0.07)"
        : "rgba(59, 130, 246, 0.05)"};
  }

  html {
    scroll-behavior: smooth;
  }

  html, body {
    overflow-x: hidden;
    max-width: 100vw;
    background: var(--bg);
    transition: background 0.4s ease, color 0.4s ease;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  body {
    position: static !important;
    transform: none !important;
  }

  ::selection {
    background: rgba(59, 130, 246, 0.3);
    color: var(--text);
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;
  transition: background 0.4s ease, color 0.4s ease;
`;

const ContentWrapper = styled.main`
  position: relative;
  z-index: 1;
`;

interface Profile3Props {
  profileContext: Omit<IProfileContext, "setIsContactFormOpen" | "setIsModalOpen">;
}

const Profile3Inner: React.FC<Profile3Props> = ({ profileContext }) => {
  const { isDark, toggleTheme } = useTheme();

  const fullContext: IProfileContext = {
    ...profileContext,
    setIsContactFormOpen: () => {},
    setIsModalOpen: () => {},
  };

  return (
    <ProfileProvider value={fullContext}>
      <DarkGlobalStyle $isDark={isDark} />
      <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      <DarkNavigation />
      <DarkMobileMenu />
      <InterestNav />
      <PageContainer>
        <ContentWrapper>
          <DarkHeroSection />
          <DarkStatsSection />
          <SectionDivider />
          <DarkAboutSection />
          <DarkSkillsSection />
          <SectionPrompt text="Curious where I've applied these?" targetSection="experience" />
          <SectionDivider />
          <DarkExperienceSection />
          <SectionPrompt text="See my academic foundation" targetSection="education" />
          <SectionDivider />
          <DarkEducationSection />
          <SectionPrompt text="Check out what I've built" targetSection="open-source" />
          <SectionDivider />
          <DarkOpenSourceSection />
        </ContentWrapper>
        <DarkContactSection />
      </PageContainer>
    </ProfileProvider>
  );
};

export const Profile3: React.FC<Profile3Props> = ({ profileContext }) => (
  <ThemeProvider>
    <Profile3Inner profileContext={profileContext} />
  </ThemeProvider>
);

export default Profile3;
