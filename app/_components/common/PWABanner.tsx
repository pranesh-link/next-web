"use client";
import { ROUTES } from "@/_constants/common";
import useAppInstalled from "@/_hooks/use-app-installed";
import useIsBrowser from "@/_hooks/use-is-browser";
import useIsMobile from "@/_hooks/use-mobile-detect";
import {
  updateIsAppInstalled,
  updateShowPwaBanner,
} from "@/_redux/actions/app";
import { useAppDispatch, useAppSelector } from "@/_redux/hooks";
import type { AppDispatch } from "@/_redux/store";
import { getLocalStorage, setLocalStorage } from "@/_utils/profile/client";
import classNames from "classnames";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { isDesktop } from "react-device-detect";
import { PWAWrapper } from "./Elements";
import InstallPWAButton from "./InstallPWAButton";

const PWABanner = () => {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const isBrowser = useIsBrowser();
  const isAppInstalled = useAppInstalled();

  const [isPwaDismissed, setIsPwaDismissed] = useState<boolean>(true);

  const pwaRef = React.createRef<HTMLDivElement>();

  const dispatch = useAppDispatch<AppDispatch>();
  const isAppInstalledState = useAppSelector(
    (state) => state.app.isAppInstalled
  );

  useEffect(() => {
    setIsPwaDismissed(getLocalStorage("pwaDismissed"));
  }, []);

  useEffect(() => {
    if (!isDesktop && isAppInstalledState) {
      // TODO temporary disable
      // openAppRef.current?.click();
    }
  }, [isAppInstalledState]);

  useEffect(() => {
    dispatch(updateIsAppInstalled(isAppInstalled));
    setLocalStorage("isAppInstalled", isAppInstalled);
  }, [dispatch, isAppInstalled]);

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

  const hideBanner = useMemo(() => {
    return isMobile ? pathname === ROUTES.ROUTE_PROFILE : !showPWAInstallBanner;
  }, [isMobile, showPWAInstallBanner, pathname]);

  useEffect(() => {
    dispatch(updateShowPwaBanner(showPWAInstallBanner || showOpenPWABanner));
  }, [showPWAInstallBanner, showOpenPWABanner, dispatch]);

  return (
    (showPWAInstallBanner || showOpenPWABanner) && (
      <>
        <PWAWrapper
          ref={pwaRef}
          $gap={10}
          $top="30px"
          $right="30px"
          $alignItems="center"
          $justifyContent="flex-end"
          className={classNames({
            hide: hideBanner,
            "position-bottom": pathname === "/",
          })}
        >
          <InstallPWAButton />
        </PWAWrapper>
      </>
    )
  );
};

export default PWABanner;
