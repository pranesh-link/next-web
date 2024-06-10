"use client";
import { ActionBtn, FlexBox, Version } from "@/_components/common/Elements";
import VersionModal from "@/_components/modal/common/VersionModal";
import CloseIcon from "@/_components/svg/CloseIcon";
import HamburgerIcon from "@/_components/svg/HamburgerIcon";
import useAppInstalled from "@/_hooks/use-app-installed";
import { useIsClient } from "@/_hooks/use-is-client";
import { updateIsAppInstalled } from "@/_redux/actions/app";
import { useAppDispatch, useAppSelector } from "@/_redux/hooks";
import { AppDispatch } from "@/_redux/store";
import { ProfileContext } from "@/_store/profile/page/context";
import { setLocalStorage } from "@/_utils/profile/client";
import classNames from "classnames";
import React, { ComponentType, useContext, useEffect, useState } from "react";
import { Transition } from "react-transition-group";
import { TransitionProps } from "react-transition-group/Transition";
import InstallPWAButton from "../common/InstallPWAButton";
import { ContentSection, IconWrap, Menu, RightSection } from "./Elements";
import MenuBar from "./MenuBar";

const TransitionComponent = Transition as ComponentType<TransitionProps>;

interface IHamburgerMenuProps {
  isOpen: boolean;
  hasPWAInstalled: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onMenuChange: (section: string) => void;
}

const HamBurgerMenu = (props: IHamburgerMenuProps) => {
  const { isOpen, setIsOpen, onMenuChange } = props;
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { appVersion: version } = useContext(ProfileContext);

  const isClient = useIsClient();
  const isAppInstalled = useAppInstalled();
  const showPWABannerState = useAppSelector((state) => state.app.showPwaBanner);

  const dispatch = useAppDispatch<AppDispatch>();

  const [hamburgerClicked, setHamburgerClicked] = useState<boolean>(false);
  const [hideMenu, setHideMenu] = useState<boolean>(window.innerWidth > 767);
  const [displayVersionModal, setDisplayVersionModal] =
    useState<boolean>(false);
  const scrollbarSize = isClient
    ? window.innerWidth - document.documentElement.clientWidth
    : 0;

  const handleResize = () => {
    setHideMenu(window.innerWidth > 767);
  };

  useEffect(() => {
    dispatch(updateIsAppInstalled(isAppInstalled));
    setLocalStorage("isAppInstalled", isAppInstalled);
  }, [dispatch, isAppInstalled]);

  useEffect(() => {
    // On open scroll to top of content div
    // Else content div will be at previously scrolled position
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    setTimeout(() => {
      // Disable body scroll to avoid double scroll on page
      document.getElementsByTagName("body")[0].style.overflow = isOpen
        ? "hidden"
        : "";
      // Add padding to body so that content inside body does not glitch
      document.getElementsByTagName("body")[0].style.paddingRight = isOpen
        ? `${scrollbarSize}px`
        : "";
    }, 100);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <VersionModal
        displayVersionModal={displayVersionModal}
        setDisplayVersionModal={setDisplayVersionModal}
      />
      <IconWrap onTouchMove={() => setIsOpen(true)}>
        <ActionBtn
          onClick={() => {
            setIsOpen(true);
            setHamburgerClicked(true);
          }}
          className={classNames("hamburger-icon", {
            clicked: hamburgerClicked,
          })}
        >
          <HamburgerIcon />
        </ActionBtn>
      </IconWrap>
      <TransitionComponent
        in={isOpen}
        duration={0}
        addEndListener={(node, done) => {
          // use the css transitionend event to mark the finish of a transition
          node.addEventListener("transitionend", done, true);
        }}
      >
        {(state) => (
          <Menu className={classNames(state, { hide: hideMenu })}>
            <ContentSection $direction="column" $justifyContent="space-around">
              <FlexBox $justifyContent="flex-end">
                <ActionBtn
                  className="close-button"
                  onClick={() => setIsOpen(false)}
                >
                  <CloseIcon />
                </ActionBtn>
              </FlexBox>
              <MenuBar
                isMobileMenu
                closeHamburgerMenu={() => setIsOpen(false)}
                onMenuChange={(section) => onMenuChange(section)}
              />
              {showPWABannerState && (
                <FlexBox $justifyContent="center">
                  <InstallPWAButton hideAnimation />
                </FlexBox>
              )}
              <Version
                href=""
                onClick={(e) => {
                  e.preventDefault();
                  setIsOpen(false);
                  setDisplayVersionModal(true);
                }}
              >
                v{version}
              </Version>
            </ContentSection>
            <RightSection onClick={() => setIsOpen(false)} />
          </Menu>
        )}
      </TransitionComponent>
    </>
  );
};

export default HamBurgerMenu;
