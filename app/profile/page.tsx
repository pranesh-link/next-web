"use client";

import { useIsClient } from "@/_hooks/use-is-client";
import Profile from "@/_components/profile/Profile";
import {
  CMS_SERVER_CONFIG,
  EMAILJS_CONFIG,
  ENVIRONMENT,
  WEB_SERVER_CONFIG,
} from "@/_constants/common";
import mockProfileData from "@/_mock/profile";
import { AppContext } from "@/_store/app/context";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isMobileOnly } from "react-device-detect";
import type { AppProps } from "next/app";
import { IsSsrMobileContext, getIsSsrMobile } from "@/_providers/mobile";
import useMobileDetect from "@/_hooks/use-is-mobile";
import Device from "@/_device/device";
import { NextPageContext } from "next";

ProfilePage.getInitialProps = ({ req }: { req: any }) => {
  let userAgent;
  if (req) {
    // if you are on the server and you get a 'req' property from your context
    userAgent = req.headers["user-agent"]; // get the user-agent from the headers
  } else {
    userAgent = navigator.userAgent; // if you are on the client you can access the navigator from the window object
  }
  console.log("user agent", userAgent);
};

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
      preloadedAssets,
      preloadSrcList,
      profileData,
      hasError, // TODO show retry
    },
  } = useContext(AppContext);
  const {
    pwa: { os, browsers },
  } = appConfig;
  const isClient = useIsClient();
  const queryParams = useSearchParams();
  const isMock = queryParams.get("demo");

  const [isHamburgerMenuOpen, setIsHamburgerMenuOpen] =
    useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState(
    isClient ? window.matchMedia("(prefers-color-scheme: dark)").matches : false
  );
  const [isMobile, setIsMobile] = useState(isMobileOnly);

  const profileDataByQueryParam = useMemo(() => {
    return isMock ? mockProfileData : profileData;
  }, [isMock, profileData]);

  const setViewportProps = useCallback(() => {
    setIsMobile(isClient ? window.innerWidth < 768 : false);
  }, [isClient]);
  console.log("isClient", isClient);
  useEffect(() => {
    if (isClient) {
      window.addEventListener("resize", setViewportProps);
      return () => window.removeEventListener("resize", setViewportProps);
    }
  }, [isClient, setViewportProps]);

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
      isMobile={mobileDetect.isMobile()}
      isInstallBannerOpen={false}
      hasPWAInstalled={false}
      isHamburgerMenuOpen={isHamburgerMenuOpen}
      setIsDownloading={() => {}}
      setIsHamburgerMenuOpen={(isHamburgerMenuOpen: boolean) =>
        setIsHamburgerMenuOpen(isHamburgerMenuOpen)
      }
      onInstallPWA={() => {}}
      environment={ENVIRONMENT}
      appVersion={version}
      deviceConfig={{ os, osName, browserName, browsers }}
      preloadSrcList={preloadSrcList}
      preloadedAssets={preloadedAssets}
      emailJsConfig={{
        serviceId: EMAILJS_CONFIG.SERVICE_ID,
        templateId: EMAILJS_CONFIG.TEMPLATE_ID,
        publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
      }}
      serverConfig={{
        webServerConfig: WEB_SERVER_CONFIG,
        cmsServerConfig: CMS_SERVER_CONFIG,
      }}
    />
  );
}
