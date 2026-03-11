"use client";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import { ProfileProvider } from "@/_store/profile/page/context";
import { IProfileContext } from "@/_store/profile/types";
import DarkNavigation from "./navigation/Navigation";
import DarkMobileMenu from "./navigation/MobileMenu";
import DarkHeroSection from "./sections/HeroSection";
import DarkAboutSection from "./sections/AboutSection";
import DarkSkillsSection from "./sections/SkillsSection";
import DarkExperienceSection from "./sections/ExperienceSection";
import DarkEducationSection from "./sections/EducationSection";
import DarkOpenSourceSection from "./sections/OpenSourceSection";
import DarkContactSection from "./sections/ContactSection";

const DarkGlobalStyle = createGlobalStyle`
  html, body {
    overflow-x: hidden;
    max-width: 100vw;
    background: #0a0a0a;
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
    color: #e5e5e5;
  }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: #0a0a0a;
  color: #e5e5e5;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;
`;

const ContentWrapper = styled.main`
  position: relative;
  z-index: 1;
`;

interface Profile3Props {
  profileContext: Omit<IProfileContext, "setIsContactFormOpen" | "setIsModalOpen">;
}

export const Profile3: React.FC<Profile3Props> = ({ profileContext }) => {

  const fullContext: IProfileContext = {
    ...profileContext,
    setIsContactFormOpen: () => {},
    setIsModalOpen: () => {},
  };

  return (
    <ProfileProvider value={fullContext}>
      <DarkGlobalStyle />
      <DarkNavigation />
      <DarkMobileMenu />
      <PageContainer>
        <ContentWrapper>
          <DarkHeroSection />
          <DarkAboutSection />
          <DarkSkillsSection />
          <DarkExperienceSection />
          <DarkEducationSection />
          <DarkOpenSourceSection />
        </ContentWrapper>
        <DarkContactSection />
      </PageContainer>
    </ProfileProvider>
  );
};

export default Profile3;
