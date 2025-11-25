"use client";

import { EMAILJS_CONFIG } from "@/_constants/common";
import { useIsClient } from "@/_hooks/use-is-client";
import useMobileDetect from "@/_hooks/use-mobile-detect";
import mockProfileData from "@/_mock/profile";
import { AppContext } from "@/_store/app/context";
import { ProfileLayoutContext } from "@/_store/profile/layout/context";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useContext, useMemo, useRef, useState } from "react";

// Optimized dynamic import with loading state
const DynamicProfileC = dynamic(() => import("@/_components/profile/Profile"), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading...</div>
    </div>
  ),
});

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
    },
  } = useContext(AppContext);
  const {
    data: { profileData, preloadedAssets, hasError },
  } = useContext(ProfileLayoutContext);
  if (hasError) {
    throw new Error("failed to fetch data");
  }
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
    <DynamicProfileC
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
