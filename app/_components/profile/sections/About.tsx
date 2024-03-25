import classNames from "classnames";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlexBoxSection,
  Desc,
  FlexBox,
  ModalBanner,
  ModalContentWrap,
} from "@/_components/common/Elements";
import { getPdfUrl, getPdfBlob } from "@/_utils/profile/server";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/context";
import AboutMeDetails from "./AboutMeDetails";
import ContactForm from "@/_components/form/contact/Form";
import ContactMe from "@/_components/common/ContactMe";
import Image from "next/image";
import DisplayPic from "@/_assets/display-pic.png";
import DownloadAnimation from "@/_assets/download.gif";
import CustomModalComponent from "@/_components/common/ModalComponent";
import { Retry } from "@/_components/form/Elements";
import { FILE_DOWNLOAD_STATES } from "@/_store/common/types";
import ProgressBar from "@/_components/common/ProgressBar";

interface IAboutProps {
  exportProfile: () => void;
}
const About = (_props: IAboutProps) => {
  const {
    isContactFormOpen,
    setIsContactFormOpen,
    setIsModalOpen,
    hasDownloadedProfile,
    isExport,
    isMobile,
    isDownloading,
    data: {
      sections: { aboutMe },
      download,
    },
    refs: { homeRef: refObj },
    preloadSrcList,
  } = React.useContext(ProfileContext);
  const pdfFileName = preloadSrcList.find(
    (item) => item.id === "resume"
  )?.fileName;
  const [copyState, setCopyState] = useState<string>("");
  const [downloadState, setDownloadState] = useState(FILE_DOWNLOAD_STATES.IDLE);
  const [online, setOnline] = useState(true);
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const showDownloadModal = useMemo(
    () =>
      [FILE_DOWNLOAD_STATES.INPROGRESS, FILE_DOWNLOAD_STATES.OFFLINE].some(
        (item) => item === downloadState
      ),
    [downloadState]
  );

  useEffect(() => {
    if (copyState) {
      setTimeout(() => {
        setCopyState("");
      }, 3000);
    }
  }, [copyState]);

  useEffect(() => {
    window.addEventListener("online", () => setOnline(true));
    window.addEventListener("offline", () => setOnline(false));

    return () => {
      window.addEventListener("online", () => setOnline(true));
      window.addEventListener("offline", () => setOnline(false));
    };
  }, []);

  const downloadFile = (url: string) => {
    if (downloadRef.current !== null) {
      downloadRef.current.download = pdfFileName || "";
      downloadRef.current.href = url;
      downloadRef.current?.click();
    }
  };

  const downloadResume = async () => {
    if (online) {
      setDownloadState(FILE_DOWNLOAD_STATES.INPROGRESS);
      const blob = await getPdfBlob(getPdfUrl(pdfFileName || ""));
      const url = URL.createObjectURL(blob.blob as Blob);
      downloadFile(url);
      resetDownloadState();
    } else {
      setDownloadState(FILE_DOWNLOAD_STATES.OFFLINE);
    }
  };

  async function retryDownloadResume() {
    setDownloadState(FILE_DOWNLOAD_STATES.RETRY);
    await downloadResume();
  }

  const resetDownloadState = useCallback(() => {
    setDownloadState(FILE_DOWNLOAD_STATES.IDLE);
  }, []);

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
      <CustomModalComponent
        isOpen={showDownloadModal}
        onRequestClose={resetDownloadState}
      >
        <DownloadingFileMessage className={classNames({ offline: !online })}>
          <p
            dangerouslySetInnerHTML={{
              __html: download.messages[downloadState],
            }}
          />
          <ProgressBar />
          <Retry
            href=""
            className={classNames({
              hide: downloadState !== FILE_DOWNLOAD_STATES.OFFLINE,
            })}
            onClick={(e) => {
              e.preventDefault();
              retryDownloadResume();
            }}
          >
            Retry
          </Retry>
        </DownloadingFileMessage>
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

const DownloadingFileMessage = styled.div`
  padding: 15px;
  border-radius: 5px;
  background: #f0f0f0;
  margin: 0 auto;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  max-width: fit-content;

  @media only screen and (max-width: 767px) {
    &.offline {
      border-radius: 5px;
    }
  }
`;
