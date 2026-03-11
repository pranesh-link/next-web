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
    background: rgba(99, 102, 241, 0.3);
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

const ScrollToTop = styled.button`
  position: fixed;
  bottom: 120px;
  right: 40px;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #a1a1aa;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  z-index: 900;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  backdrop-filter: blur(12px);

  &.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  &:hover {
    background: rgba(99, 102, 241, 0.12);
    border-color: rgba(99, 102, 241, 0.3);
    color: #e5e5e5;
  }

  @media screen and (max-width: 768px) {
    bottom: 100px;
    right: 24px;
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  @media screen and (max-width: 480px) {
    bottom: 90px;
    right: 16px;
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;

interface Profile3Props {
  profileContext: Omit<IProfileContext, "setIsContactFormOpen" | "setIsModalOpen">;
}

export const Profile3: React.FC<Profile3Props> = ({ profileContext }) => {
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
        <ScrollToTop
          className={showScrollTop ? "visible" : ""}
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          ↑
        </ScrollToTop>
      </PageContainer>
    </ProfileProvider>
  );
};

export default Profile3;
