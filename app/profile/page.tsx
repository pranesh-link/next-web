"use client";

import Profile from "@/_components/profile/Profile";
import { EMAILJS_CONFIG } from "@/_constants/common";
import { useIsClient } from "@/_hooks/use-is-client";
import useMobileDetect from "@/_hooks/use-mobile-detect";
import mockProfileData from "@/_mock/profile";
import { AppContext } from "@/_store/app/context";
import { ProfileLayoutContext } from "@/_store/profile/layout/context";
import { useSearchParams } from "next/navigation";
import { useContext, useMemo, useRef, useState } from "react";

export default function ProfilePage() {
  const homeRef = useRef(null);
  const skillsRef = useRef(null);
  const experienceRef = useRef(null);
  const educationRef = useRef(null);
  const contactRef = useRef(null);
  const openSourceRef = useRef(null);

  const {
    data: {
      appConfig = { pwa: { os: [], browsers: [] } },
      currentDevice: { browserName, osName },
      version,
      preloadSrcList,
      // profileData,
      hasError, // TODO show retry
    },
  } = useContext(AppContext);
  const {
    data: { profileData, preloadedAssets },
  } = useContext(ProfileLayoutContext);
  const {
    pwa: { os, browsers },
  } = appConfig;
  const isClient = useIsClient();
  const queryParams = useSearchParams();
  const isMock = queryParams.get("demo");

  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] =
    useState<boolean>(false);
  const [isDarkMode] = useState(
    isClient ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  );

  const profileDataByQueryParam = useMemo(() => {
    return isMock ? mockProfileData : profileData;
  }, [isMock, profileData]);

  // TODO handle viewport change
  const mobileDetect = useMobileDetect();

  return (
    <Profile
      isExport={false}
      isDarkMode={isDarkMode}
      profileData={profileDataByQueryParam}
      pwaOffset={40}
      refs={{
        homeRef,
        skillsRef,
        experienceRef,
        educationRef,
        contactRef,
        openSourceRef,
      }}
      isDownloading={false}
      isMobile={mobileDetect}
      isInstallBannerOpen={false}
      hasPWAInstalled={false}
      isHamburgerMenuOpen={isHamburgerMenuOpen}
      setIsDownloading={() => {}}
      setIsHamburgerMenuOpen={(isHamburgerMenuOpen: boolean) =>
        setIsHamburgerMenuOpen(isHamburgerMenuOpen)
      }
      onInstallPWA={() => {}}
      appVersion={version}
      deviceConfig={{ os, osName, browserName, browsers }}
      preloadSrcList={preloadSrcList}
      preloadedAssets={preloadedAssets}
      emailJsConfig={{
        serviceId: EMAILJS_CONFIG.SERVICE_ID,
        templateId: EMAILJS_CONFIG.TEMPLATE_ID,
        publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
      }}
    />
  );
}
