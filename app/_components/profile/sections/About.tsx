import classNames from "classnames";
import React, { useEffect, useRef, useState } from "react";
import {
  FlexBoxSection,
  Desc,
  FlexBox,
  ModalBanner,
  ModalContentWrap,
  CustomModalComponent,
} from "@/_components/common/Elements";
import { getIconUrl, getPdfUrl, getPdfBlob } from "@/_utils/profile/server";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/context";
import AboutMeDetails from "./AboutMeDetails";
import ContactForm from "@/_components/form/contact/Form";
import ContactMe from "@/_components/common/ContactMe";
import Image from "next/image";
import DisplayPic from "@/_assets/display-pic.png";
import DownloadAnimation from "@/_assets/download.gif";

interface IAboutProps {
  exportProfile: () => void;
}
const About = (_props: IAboutProps) => {
  const {
    isContactFormOpen,
    setIsContactFormOpen,
    setIsModalOpen,
    hasDownloadedProfile,
    environment,
    isExport,
    isMobile,
    isDownloading,
    data: {
      sections: { aboutMe },
      download,
    },
    refs: { homeRef: refObj },
    preloadSrcList,
    serverConfig: { cmsServerConfig },
  } = React.useContext(ProfileContext);

  const pdfFileName = preloadSrcList.find(
    (item) => item.id === "resume"
  )?.fileName;
  const [copyState, setCopyState] = useState<string>("");
  const downloadRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (copyState) {
      setTimeout(() => {
        setCopyState("");
      }, 3000);
    }
  }, [copyState]);

  const downloadFile = (url: string) => {
    if (downloadRef.current !== null) {
      downloadRef.current.download = pdfFileName || "";
      downloadRef.current.href = url;
      downloadRef.current?.click();
    }
  };

  const downloadResume = async () => {
    const blob = await getPdfBlob(
      getPdfUrl(environment, pdfFileName || "", cmsServerConfig)
    );
    const url = URL.createObjectURL(blob.blob as Blob);
    downloadFile(url);
  };

  return (
    <>
      <CustomModalComponent
        className="contact-modal-content"
        isOpen={isContactFormOpen}
        ariaHideApp={false}
      >
        <ModalContentWrap $direction="column" className="contact-modal">
          <ModalBanner className="header" />
          <ContactForm
            closeModal={() => {
              setIsContactFormOpen(false);
              setIsModalOpen(false);
            }}
          />
          <ModalBanner className="footer" />
        </ModalContentWrap>
      </CustomModalComponent>
      <FlexBoxSection
        className={classNames("profile-section", "about", { export: isExport })}
        $justifyContent={isExport ? "normal" : "center"}
        ref={isExport ? null : refObj}
        id={isExport ? "" : "home"}
      >
        <FlexBoxSection
          $direction="column"
          className={classNames("about-me", { export: isExport })}
        >
          {!isExport && isMobile && (
            <FlexBoxSection
              $justifyContent={isMobile ? "space-around" : "normal"}
              className="image"
            >
              <div className="image-wrap">
                <Image
                  alt=""
                  className="profile-image"
                  width={125}
                  height={125}
                  src={DisplayPic}
                  priority
                />
              </div>
            </FlexBoxSection>
          )}
          <Desc
            className="about"
            dangerouslySetInnerHTML={{ __html: aboutMe.info as string }}
          />
        </FlexBoxSection>
        <FlexBoxSection $alignItems="center" className="image-details-wrap">
          {(!isMobile || isExport) && (
            <FlexBoxSection
              $justifyContent={isMobile ? "space-around" : "normal"}
              className="image"
            >
              <div className="image-wrap">
                <Image
                  alt="profile-image"
                  className="profile-image"
                  width={200}
                  height={200}
                  src={DisplayPic}
                  unoptimized
                  priority
                />
              </div>
            </FlexBoxSection>
          )}
          <FlexBoxSection $direction="column">
            <AboutMeDetails
              copyState={copyState}
              setCopyState={(copyInfoId: string) => {
                setCopyState(copyInfoId);
              }}
            />
            <InterestedInProfile
              $isMobile={isMobile}
              $disabled={download.download.disabled}
              className={classNames({
                "downloaded-profile": hasDownloadedProfile,
              })}
              $alignItems="center"
            >
              {!download.download.disabled &&
                !isDownloading &&
                !hasDownloadedProfile && (
                  <>
                    <a
                      href="placeholder_href"
                      ref={downloadRef}
                      download={pdfFileName}
                      className="hide"
                    >
                      Placeholder
                    </a>

                    <Image
                      className="download"
                      alt="Click here"
                      width={25}
                      height={25}
                      onClick={downloadResume}
                      src={DownloadAnimation}
                      priority
                    />
                    <span className="download-text">
                      {download.download.message}
                    </span>
                  </>
                )}
              <ContactMe />
            </InterestedInProfile>
          </FlexBoxSection>
        </FlexBoxSection>
      </FlexBoxSection>
    </>
  );
};

export default About;

const InterestedInProfile = styled(FlexBox)<{
  $isMobile: boolean;
  $disabled?: boolean;
}>`
  margin: ${(props) => (props.$isMobile ? "10px 0 0 0" : "10px 0 0 0px")};
  min-height: ${(props) => (props.$disabled ? "0px" : "50px")};
  font-weight: bold;
  &.downloaded-profile {
    margin-left: ${(props) => (props.$isMobile ? "0" : "5px")};
  }

  .download {
    min-width: 100px;
    margin-right: 5px;
    border-radius: 5px;
    cursor: pointer;
  }

  .download-text {
    overflow: hidden;
    white-space: nowrap;
    width: 0;
    animation: typing;
    animation-duration: 3s;
    animation-timing-function: steps(30, end);
    animation-fill-mode: forwards;
  }

  @keyframes typing {
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  }
  .downloading-text {
    margin-left: 5px;
    .progress-animation {
      position: relative;
      width: 7px;
      height: 7px;
      border-radius: 5px;
      background-color: #3f9c35;
      color: #3f9c35;
      animation: flashing 1s infinite linear alternate;
      animation-delay: 0.5s;
      margin: 5px 0 0 20px;
      &::before,
      &::after {
        content: "";
        display: inline-block;
        position: absolute;
        top: 0;
      }
      &::before {
        left: -15px;
        width: 7px;
        height: 7px;
        border-radius: 5px;
        background-color: #3f9c35;
        color: #3f9c35;
        animation: flashing 1s infinite alternate;
        animation-delay: 0s;
      }
      &::after {
        left: 15px;
        width: 7px;
        height: 7px;
        border-radius: 5px;
        background-color: #3f9c35;
        color: #3f9c35;
        animation: flashing 1s infinite alternate;
        animation-delay: 1s;
      }

      @keyframes flashing {
        0% {
          background-color: #3f9c35;
        }
        50%,
        100% {
          background-color: rgba(152, 128, 255, 0.2);
        }
      }
    }
  }
`;
