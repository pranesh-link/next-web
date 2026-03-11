"use client";

import { EMAILJS_CONFIG } from "@/_constants/common";
import useMobileDetect from "@/_hooks/use-mobile-detect";
import { AppContext } from "@/_store/app/context";
import { ProfileLayoutContext } from "@/_store/profile/layout/context";
import dynamic from "next/dynamic";
import { useContext, useRef } from "react";

const DynamicProfile3 = dynamic(
  () => import("@/_components/profile-3.0/Profile3"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            color: "#a1a1aa",
            fontSize: "1.2rem",
            fontWeight: "500",
          }}
        >
          Loading...
        </div>
      </div>
    ),
  }
);

export default function AdminPage() {
  const homeRef = useRef(null);
  const skillsRef = useRef(null);
  const experienceRef = useRef(null);
  const educationRef = useRef(null);
  const contactRef = useRef(null);
  const openSourceRef = useRef(null);

  const {
    data: {
      appConfig = { pwa: { os: [], browsers: [] } },
      currentDevice = { osName: "", browserName: "" },
      version = "1.0.0",
      preloadSrcList = [],
    },
  } = useContext(AppContext);

  const {
    data: { profileData, preloadedAssets = [], hasError = false },
  } = useContext(ProfileLayoutContext);

  const isMobile = Boolean(useMobileDetect());

  if (hasError) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#0a0a0a",
          color: "#a1a1aa",
          fontSize: "1.2rem",
          padding: "20px",
          textAlign: "center",
        }}
      >
        Failed to load profile data. Please try again later.
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const deviceConfig = {
    os: appConfig.pwa.os,
    browsers: appConfig.pwa.browsers,
    osName: currentDevice.osName || "",
    browserName: currentDevice.browserName || "",
  };

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
    isDarkMode: true,
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

  return <DynamicProfile3 profileContext={profileContext} />;
}
