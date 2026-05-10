"use client";

import { EMAILJS_CONFIG } from "@/_constants/common";
import useMobileDetect from "@/_hooks/use-mobile-detect";
import { AppContext } from "@/_store/app/context";
import { ProfileLayoutContext } from "@/_store/profile/layout/context";
import dynamic from "next/dynamic";
import { useContext, useRef } from "react";
import styled from "styled-components";

const FullscreenGradient = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const LoadingText = styled.div`
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  animation: pulse 2s ease-in-out infinite;
`;

const ErrorMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.2rem;
  padding: 20px;
  text-align: center;
`;

/**
 * Profile 2.0 Page
 * 
 * This is the next-generation profile page with a modern, rich UI
 * Route: /profile-2.0
 * 
 * Key Improvements:
 * - Desktop navigation with smooth scrolling
 * - Mobile hamburger menu with slide-in overlay
 * - Fresh visual design with glassmorphism effects
 * - Animated hero section
 * - Card-based layout for better content organization
 * - Timeline visualization for experience
 * - HTML content parsing support
 * - Enhanced mobile responsiveness
 * - Smooth transitions and animations throughout
 * - No horizontal scroll on any device
 * 
 * Data Source:
 * - Reuses the same ProfileLayoutContext as the original profile
 * - Compatible with existing CMS data structure
 * - No backend changes required
 */

// Optimized dynamic import with loading state
const DynamicProfile2 = dynamic(
  () => import("@/_components/profile-2.0/Profile2"),
  {
    ssr: false,
    loading: () => (
      <FullscreenGradient>
        <LoadingText>Loading Profile 2.0...</LoadingText>
      </FullscreenGradient>
    ),
  }
);

export default function Profile2Page() {
  // Refs for section scrolling (kept for compatibility, though not heavily used in 2.0)
  const homeRef = useRef(null);
  const skillsRef = useRef(null);
  const experienceRef = useRef(null);
  const educationRef = useRef(null);
  const contactRef = useRef(null);
  const openSourceRef = useRef(null);

  // App context
  const {
    data: {
      appConfig = { pwa: { os: [], browsers: [] } },
      currentDevice = { osName: "", browserName: "" },
      version = "1.0.0",
      preloadSrcList = [],
    },
  } = useContext(AppContext);

  // Profile data from layout context
  const {
    data: { profileData, preloadedAssets = [], hasError = false },
  } = useContext(ProfileLayoutContext);

  // Mobile detection
  const isMobile = Boolean(useMobileDetect());

  // Error handling
  if (hasError) {
    return (
      <ErrorMessage>
        Failed to load profile data. Please try again later.
      </ErrorMessage>
    );
  }

  if (!profileData) {
    return null;
  }

  // Device configuration
  const deviceConfig = {
    os: appConfig.pwa.os,
    browsers: appConfig.pwa.browsers,
    osName: currentDevice.osName || "",
    browserName: currentDevice.browserName || "",
  };

  // Check if PWA should show install banner
  const isInstallBannerOpen = false;

  // Build profile context for Profile2 component
  const profileContext = {
    data: profileData,
    refs: {
      homeRef,
      skillsRef,
      experienceRef,
      educationRef,
      contactRef,
      openSourceRef,
    },
    deviceConfig,
    preloadSrcList,
    preloadedAssets,
    currentSection: "aboutMe",
    appVersion: version,
    isDarkMode: false,
    isMobile,
    showComponentLibUrl: false,
    isInstallBannerOpen,
    isContactFormOpen: false,
    isModalOpen: false,
    emailJsConfig: {
      serviceId: EMAILJS_CONFIG.SERVICE_ID,
      templateId: EMAILJS_CONFIG.TEMPLATE_ID,
      publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
    },
    pwaOffset: 0,
  };

  return <DynamicProfile2 profileContext={profileContext} />;
}
