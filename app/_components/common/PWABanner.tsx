"use client";
import useAppInstalled from "@/_hooks/use-app-installed";
import useIsBrowser from "@/_hooks/use-is-browser";
import {
  updateIsAppInstalled,
  updatePwaOffset,
  updateShowPwaBanner,
} from "@/_redux/actions/app";
import { useAppDispatch, useAppSelector } from "@/_redux/hooks";
import type { AppDispatch } from "@/_redux/store";
import { AppContext } from "@/_store/app/context";
import {
  clearLocalStorage,
  getLocalStorage,
  setLocalStorage,
} from "@/_utils/profile/client";
import { isSupportedBrowserAndOS } from "@/_utils/profile/server";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { isDesktop } from "react-device-detect";
import { CloseIcon } from "../svg";
import { PWAWrapper } from "./Elements";

interface PWABannerProps {
  isMobile: boolean;
}
const PWABanner = function (props: PWABannerProps) {
  const { isMobile } = props;
  const {
    data: {
      pwa: { messages },
      appConfig: {
        pwa: { browsers, os },
      },
      currentDevice: { osName, browserName },
    },
  } = useContext(AppContext);
  const pathname = usePathname();
  const openAppRef = useRef<HTMLAnchorElement>(null);

  const [prompt, setPrompt] = useState<any>(null);
  const [isPwaDismissed, setIsPwaDismissed] = useState<boolean>(true);
  const isBrowser = useIsBrowser();
  const isAppInstalled = useAppInstalled();

  const pwaRef = React.createRef<HTMLDivElement>();
  const dispatch = useAppDispatch<AppDispatch>();
  const showPWABannerState = useAppSelector((state) => state.app.showPwaBanner);
  const isAppInstalledState = useAppSelector(
    (state) => state.app.isAppInstalled
  );

  const closeInstallBanner = () => {
    setIsPwaDismissed(true);
    setLocalStorage("pwaDismissed", true);
  };

  useEffect(() => {
    setIsPwaDismissed(getLocalStorage("pwaDismissed"));
  }, []);

  useEffect(() => {
    if (!isDesktop && isAppInstalledState) {
      openAppRef.current?.click();
    }
  }, [isAppInstalledState]);

  const NotNowButton = (
    <button className="not-now" onClick={closeInstallBanner}>
      {isMobile ? <CloseIcon /> : <>{messages.no}</>}
    </button>
  );

  const PWAInstallMessage = (
    <p>{isAppInstalledState ? messages.relatedApp : messages.install}</p>
  );

  const InstallButton = (
    <button
      className="install"
      onClick={async () => {
        if (isAppInstalledState) return;

        await prompt.prompt();
      }}
    >
      {messages.yes}
    </button>
  );

  const OpenPWA = (
    <a
      ref={openAppRef}
      href={process.env.NEXT_PUBLIC_SITE_URL}
      className={classNames("open-pwa", { hide: isDesktop })}
      target="_blank"
      rel="noreferrer"
    >
      {messages.open}
    </a>
  );

  const hasPWASupport = useMemo(() => {
    return isSupportedBrowserAndOS(browsers, os, browserName, osName);
  }, [browsers, os, browserName, osName]);

  const handleBeforeInstallPrompt = (e: any) => {
    clearLocalStorage();
    e.preventDefault();
    setPrompt(e);
  };

  useEffect(() => {
    dispatch(updateIsAppInstalled(isAppInstalled));
    setLocalStorage("isAppInstalled", isAppInstalled);
  }, [dispatch, isAppInstalled]);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const dispatchPwaOffsetUpdate = useCallback(() => {
    const clientHeight = pwaRef?.current?.clientHeight ?? 0;
    dispatch(updatePwaOffset(clientHeight));
  }, [dispatch, pwaRef]);

  useEffect(() => {
    window.addEventListener("resize", dispatchPwaOffsetUpdate);

    return () => {
      window.removeEventListener("resize", dispatchPwaOffsetUpdate);
    };
  }, [dispatchPwaOffsetUpdate]);

  const showPWAInstallBanner = useMemo(() => {
    return (
      pathname !== "/maintenance" &&
      !isAppInstalledState &&
      !isPwaDismissed &&
      isBrowser
    );
  }, [isAppInstalledState, isPwaDismissed, isBrowser, pathname]);

  const showOpenPWABanner = useMemo(() => {
    return (
      pathname !== "/maintenance" &&
      !isPwaDismissed &&
      isAppInstalledState &&
      isBrowser
    );
  }, [isAppInstalledState, isPwaDismissed, isBrowser, pathname]);

  useEffect(() => {
    dispatch(updateShowPwaBanner(showPWAInstallBanner || showOpenPWABanner));
  }, [showPWAInstallBanner, showOpenPWABanner, dispatch]);

  useLayoutEffect(() => {
    if (showPWABannerState) {
      dispatchPwaOffsetUpdate();
    }
  }, [pwaRef, showPWABannerState, dispatchPwaOffsetUpdate]);

  return (
    (showPWAInstallBanner || showOpenPWABanner) && (
      <PWAWrapper
        ref={pwaRef}
        $gap={10}
        $top="0"
        $alignItems="center"
        $justifyContent="space-between"
        className={classNames({
          hide: isMobile ? !hasPWASupport : !showPWAInstallBanner,
        })}
      >
        {showPWAInstallBanner && (
          <>
            {NotNowButton}
            {PWAInstallMessage}
            {InstallButton}
          </>
        )}
        {showOpenPWABanner && (
          <>
            {NotNowButton}
            {PWAInstallMessage}
            {OpenPWA}
          </>
        )}
      </PWAWrapper>
    )
  );
};

export default PWABanner;
