"use client";
import { Overlay } from "@/_components/common/Elements";
import { ProfileProvider } from "@/_store/profile/page/context";
import {
  IDeviceConfig,
  IEmailJsConfig,
  IPreloadSrc,
  IPreloadedAsset,
  IProfileData,
} from "@/_store/profile/types";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import HamBurgerMenu from "./HamBurgerMenu";
import MenuBar from "./MenuBar";
import ProfileSections from "./ProfileSections";

interface ProfileProps {
  profileData: IProfileData;
  refs: {
    homeRef: React.MutableRefObject<any>;
    skillsRef: React.MutableRefObject<any>;
    experienceRef: React.MutableRefObject<any>;
    educationRef: React.MutableRefObject<any>;
    contactRef: React.MutableRefObject<any>;
    openSourceRef: React.MutableRefObject<any>;
  };
  preloadSrcList: IPreloadSrc[];
  preloadedAssets: IPreloadedAsset[];
  emailJsConfig: IEmailJsConfig;
  appVersion: string;
  isDarkMode: boolean;
  isDownloading: boolean;
  isMobile: boolean;
  isHamburgerMenuOpen: boolean;
  isInstallBannerOpen: boolean;
  isExport: boolean;
  showComponentLibUrl?: boolean;
  deviceConfig: IDeviceConfig;
  setIsDownloading: (isDownloading: boolean) => void;
  setIsHamburgerMenuOpen: (isHamburgerMenuOpen: boolean) => void;
}

const Profile = (props: ProfileProps) => {
  const {
    profileData,
    refs: {
      homeRef,
      skillsRef,
      experienceRef,
      educationRef,
      contactRef,
      openSourceRef,
    },
    isDownloading,
    isMobile,
    isHamburgerMenuOpen,
    isInstallBannerOpen,
    isExport,
    setIsHamburgerMenuOpen,
    appVersion,
    preloadSrcList,
    preloadedAssets,
    deviceConfig,
    emailJsConfig,
    isDarkMode,
    showComponentLibUrl = true,
  } = props;
  const [currentSection, setCurrentSection] = useState<string>("aboutMe");
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  let timer: NodeJS.Timeout;
  useEffect(() => {
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    isModalOpen
      ? document.body.classList.add("modal-open")
      : document.body.classList.remove("modal-open");
  }, [isModalOpen]);

  return (
    <>
      <ProfileProvider
        value={{
          data: profileData,
          refs: {
            homeRef,
            skillsRef,
            experienceRef,
            educationRef,
            contactRef,
            openSourceRef,
          },
          isDarkMode,
          deviceConfig,
          appVersion,
          currentSection,
          isExport,
          isDownloading,
          isMobile,
          isInstallBannerOpen,
          isContactFormOpen,
          isModalOpen,
          preloadSrcList,
          preloadedAssets,
          emailJsConfig,
          showComponentLibUrl,
          setIsContactFormOpen,
          setIsModalOpen,
        }}
      >
        <HamBurgerMenu
          isOpen={isHamburgerMenuOpen}
          setIsOpen={(isOpen) => setIsHamburgerMenuOpen(isOpen)}
          onMenuChange={(section) => setCurrentSection(section)}
        />
        {isMobile && <Swipe onTouchMove={() => setIsHamburgerMenuOpen(true)} />}
        <MenuBar onMenuChange={(section) => setCurrentSection(section)} />
        {!isHamburgerMenuOpen && (
          <>
            <Overlay
              $background="#f0f0f0"
              $height={15}
              $bottom={isMobile ? "0" : "50"}
              $opacity={0.9}
            />
            <Overlay
              $background="#f0f0f0"
              $height={15}
              $bottom={isMobile ? "15" : "65"}
              $opacity={0.6}
            />
          </>
        )}
        <ProfileSections />
      </ProfileProvider>
    </>
  );
};

export default Profile;

const Swipe = styled.div`
  height: 100%;
  width: 60px;
  right: 0;
  position: fixed;
`;
