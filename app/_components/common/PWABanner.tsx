"use client";
import {
  updateIsAppInstalled,
  updatePwaOffset,
  updateShowPwaBanner,
} from "@/_redux/actions/app";
import { useAppDispatch, useAppSelector } from "@/_redux/hooks";
import type { AppDispatch } from "@/_redux/store";
import { AppContext } from "@/_store/app/context";
import { getLocalStorage, setLocalStorage } from "@/_utils/profile/client";
import { isSupportedBrowserAndOS } from "@/_utils/profile/server";
import classNames from "classnames";
import React, {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
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

  const [prompt, setPrompt] = useState<any>(null);
  const [isStandAlone, setIsStandAlone] = useState<boolean>(false);
  const [isPwaDismissed, setIsPwaDismissed] = useState<boolean>(true);

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
        const response = await prompt.prompt();
        const isInstalled = response.outcome === "accepted";
        dispatch(updateIsAppInstalled(isInstalled));
        setLocalStorage("isAppInstalled", isInstalled);
      }}
    >
      {isAppInstalledState && !isStandAlone ? (
        <a
          href="" //{getWebUrl(environment, webServerConfig)}
          target="_blank"
          rel="noreferrer"
        >
          {messages.open}
        </a>
      ) : (
        messages.yes
      )}
    </button>
  );

  const hasPWASupport = useMemo(() => {
    return isSupportedBrowserAndOS(browsers, os, browserName, osName);
  }, [browsers, os, browserName, osName]);

  const handleBeforeInstallPrompt = (e: any) => {
    e.preventDefault();
    setPrompt(e);
  };

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
    window
      .matchMedia("(display-mode: standalone)")
      .addEventListener("change", ({ matches }) => {
        setIsStandAlone(matches);
      });
    window.addEventListener("resize", dispatchPwaOffsetUpdate);

    return () => {
      window
        .matchMedia("(display-mode: standalone)")
        .removeEventListener("change", ({ matches }) => {
          setIsStandAlone(matches);
        });
      window.removeEventListener("resize", dispatchPwaOffsetUpdate);
    };
  }, [dispatchPwaOffsetUpdate]);

  const showPWABanner = useMemo(() => {
    return !isPwaDismissed && !isStandAlone;
  }, [isPwaDismissed, isStandAlone]);

  useEffect(() => {
    dispatch(updateShowPwaBanner(showPWABanner));
  }, [showPWABanner, dispatch]);
  console.log("isStandAlone", isStandAlone);

  useLayoutEffect(() => {
    if (showPWABannerState) {
      dispatchPwaOffsetUpdate();
    }
  }, [pwaRef, showPWABannerState, dispatchPwaOffsetUpdate]);

  return showPWABanner ? (
    <PWAWrapper
      ref={pwaRef}
      $gap={10}
      $top="0"
      $alignItems="center"
      $justifyContent="space-between"
      className={classNames({ hide: isMobile ? !hasPWASupport : false })}
    >
      {NotNowButton}
      {PWAInstallMessage}
      {InstallButton}
    </PWAWrapper>
  ) : null;
};

export default PWABanner;
