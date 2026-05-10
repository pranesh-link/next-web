"use client";
import React from "react";
import { ProfileProvider } from "@/_store/profile/page/context";
import { IProfileContext } from "@/_store/profile/types";
import Navigation from "./navigation/Navigation";
import MobileMenu from "./navigation/MobileMenu";
import ContactSection from "./sections/ContactSection";
import HeroSection from "./sections/HeroSection";
import AboutSection from "./sections/AboutSection";
import SkillsSection from "./sections/SkillsSection";
import ExperienceSection from "./sections/ExperienceSection";
import EducationSection from "./sections/EducationSection";
import OpenSourceSection from "./sections/OpenSourceSection";
import {
  ContentWrapper,
  FloatingShapes,
  GlobalStyle,
  PageContainer,
  ScrollToTop,
} from "./Profile2.styled";
import { useScrollToTop } from "./useScrollToTop";

/**
 * Profile 2.0 Component
 * Modern, responsive profile page with rich UI
 * 
 * Design Philosophy:
 * - Glassmorphism and gradient aesthetics for modern feel
 * - Card-based architecture for modular content
 * - Smooth animations and transitions for premium experience
 * - Mobile-first responsive design
 * - Accessibility-friendly interactions
 * 
 * Key Features:
 * - Desktop navigation with smooth scrolling
 * - Mobile hamburger menu with slide-in overlay
 * - Animated hero section with gradient background
 * - Timeline-based experience visualization
 * - Skill categorization with star ratings
 * - Interactive project cards
 * - HTML content parsing support
 */

interface Profile2Props {
  profileContext: Omit<IProfileContext, "setIsContactFormOpen" | "setIsModalOpen">;
}

export const Profile2: React.FC<Profile2Props> = ({ profileContext }) => {
  const { showScrollTop, scrollToTop } = useScrollToTop();

  // Create full context with mock handlers for modal states
  const fullContext: IProfileContext = {
    ...profileContext,
    setIsContactFormOpen: () => {},
    setIsModalOpen: () => {},
  };

  return (
    <ProfileProvider value={fullContext}>
      <GlobalStyle />
      
      {/* Navigation components - rendered at root level outside any containers */}
      <Navigation />
      <MobileMenu />

      <PageContainer>
        <FloatingShapes />
        
        <ContentWrapper>
          {/* Hero section with introduction */}
          <HeroSection />

          {/* About section with personal info */}
          <AboutSection />

          {/* Skills section with ratings */}
          <SkillsSection />

          {/* Experience timeline */}
          <ExperienceSection />

          {/* Education information */}
          <EducationSection />

          {/* Open source projects */}
          <OpenSourceSection />
        </ContentWrapper>

        {/* Sticky contact section at bottom */}
        <ContactSection />

        {/* Scroll to top button */}
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

export default Profile2;
