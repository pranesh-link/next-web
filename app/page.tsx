"use client";

import { EMAILJS_CONFIG } from "@/_constants/common";
import useMobileDetect from "@/_hooks/use-mobile-detect";
import { AppContext } from "@/_store/app/context";
import { ProfileLayoutContext } from "@/_store/profile/layout/context";
import dynamic from "next/dynamic";
import { useContext, useRef } from "react";
import "./globals.scss";

export const dynamicParams = false;

// Profile 2.0 is now the default home page
const DynamicProfile2 = dynamic(
  () => import("@/_components/profile-2.0/Profile2"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #60a5fa 100%)",
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: "1.5rem",
            fontWeight: "600",
          }}
        >
          Loading...
        </div>
      </div>
    ),
  }
);

export default function HomePage() {
  // Refs for section scrolling
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
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #60a5fa 100%)",
        color: "white",
        fontSize: "1.2rem",
        padding: "20px",
        textAlign: "center"
      }}>
        Failed to load profile data. Please try again later.
      </div>
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
    isInstallBannerOpen: false,
    isContactFormOpen: false,
    isModalOpen: false,
    emailJsConfig: {
      serviceId: EMAILJS_CONFIG.SERVICE_ID,
      templateId: EMAILJS_CONFIG.TEMPLATE_ID,
      publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
    },
    pwaOffset: 0,
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      <DynamicProfile2 profileContext={profileContext} />
    </div>
  );
}
