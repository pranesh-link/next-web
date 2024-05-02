import { ActionBtn } from "@/_components/common/Elements";
import { ProfileContext } from "@/_store/profile/page/context";
import {
  getPreloadedAsset,
  isSupportedBrowserAndOS,
} from "@/_utils/profile/server";
import classNames from "classnames";
import React, { useMemo } from "react";
import styled from "styled-components";
import LazyLoadedImage from "./LazyLoadedImage";

const ContactMe = () => {
  const {
    setIsContactFormOpen,
    setIsModalOpen,
    isMobile,
    data: {
      forms: { contactForm },
    },
    preloadedAssets,
    deviceConfig: { os, osName, browserName, browsers },
  } = React.useContext(ProfileContext);

  const contactMeIcon = useMemo(
    () => getPreloadedAsset(preloadedAssets, "contactMeIcon"),
    [preloadedAssets]
  );

  const hasPWASupport = useMemo(() => {
    return isSupportedBrowserAndOS(browsers, os, browserName, osName);
  }, [browsers, os, browserName, osName]);

  return (
    <ContactMeButton
      className={classNames({ "has-pwa-banner": isMobile && hasPWASupport })}
      onClick={() => {
        setIsContactFormOpen(true);
        setIsModalOpen(true);
      }}
    >
      <LazyLoadedImage
        alt="contact-me"
        height={30}
        width={30}
        src={contactMeIcon}
      />
      {!isMobile && <>{contactForm.actionButtonLabel}</>}
    </ContactMeButton>
  );
};

export default ContactMe;

const ContactMeButton = styled(ActionBtn)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  color: #fff;
  padding: 10px 20px;
  background: #3f9c35;
  border-radius: 50px;
  right: 30px;
  bottom: 100px;
  text-transform: uppercase;
  font-weight: bold;
  height: fit-content;

  img {
    background: #f0f0f0;
    padding: 5px;
    border-radius: 50%;
    margin-right: 5px;
  }
  &:hover {
    box-shadow: transparent 0px -1px 0px 0px,
      rgba(240, 240, 240, 0.3) 0px -1px 0px inset, rgb(63, 156, 53) 0px 2px 12px;
  }
  @media only screen and (max-width: 767px) {
    padding: 5px;
    right: 20px;
    animation: blinker 5s linear infinite;
    box-shadow: rgb(0 0 0 / 20%) 0 -1px 0px 1px, inset #304701 0 -1px 0px,
      #3f9c35 0 2px 12px;
    &:hover {
      border: none;
      background: #3f9c35;
    }
    img {
      margin-right: 0;
    }
  }
`;
