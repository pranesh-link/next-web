import DisplayPic from "@/_assets/display-pic.png";
import DownloadAnimation from "@/_assets/download.gif";
import ContactMe from "@/_components/common/ContactMe";
import { Desc, FlexBoxSection } from "@/_components/common/Elements";
import LazyLoadedImage from "@/_components/common/LazyLoadedImage";
import ContactModal from "@/_components/modal/profile/ContactModal";
import DownloadProgressModal from "@/_components/modal/profile/DownloadProgressModal";
import useIsOnline from "@/_hooks/use-is-online";
import { AppContext } from "@/_store/app/context";
import { FILE_DOWNLOAD_STATES } from "@/_store/common/types";
import { ProfileContext } from "@/_store/profile/page/context";
import { getPdfObjectUrl } from "@/_utils/profile/server";
import classNames from "classnames";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { InterestedInProfile } from "../Elements";
import AboutMeDetails from "./AboutMeDetails";

interface IAboutProps {
  exportProfile: () => void;
}
const About = (_props: IAboutProps) => {
  const {
    isContactFormOpen,
    isExport,
    isMobile,
    data: {
      sections: { aboutMe },
      download,
    },
    refs: { homeRef: refObj },

    preloadSrcList,
  } = useContext(ProfileContext);

  const {
    data: {
      features: { downloadResume: canDownloadResume, contactMe },
    },
  } = useContext(AppContext);

  const pdfFileName = preloadSrcList.find(
    (item) => item.id === "resume"
  )?.fileName;
  const [copyState, setCopyState] = useState<string>("");
  const [downloadState, setDownloadState] = useState(FILE_DOWNLOAD_STATES.IDLE);
  const online = useIsOnline();
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const showDownloadModal = useMemo(
    () =>
      [
        FILE_DOWNLOAD_STATES.INPROGRESS,
        FILE_DOWNLOAD_STATES.ERROR,
        FILE_DOWNLOAD_STATES.OFFLINE,
      ].some((item) => item === downloadState),
    [downloadState]
  );

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
    if (online) {
      setDownloadState(FILE_DOWNLOAD_STATES.INPROGRESS);
      try {
        const fileObjectUrl = await getPdfObjectUrl(pdfFileName);
        downloadFile(fileObjectUrl);
        resetDownloadState();
      } catch (error) {
        setDownloadState(FILE_DOWNLOAD_STATES.ERROR);
      }
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
      <ContactModal isOpen={isContactFormOpen} />
      <DownloadProgressModal
        showModal={showDownloadModal}
        downloadMessages={download.messages}
        online={online}
        downloadState={downloadState}
        resetState={resetDownloadState}
        retryDownload={retryDownloadResume}
      />
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
                <LazyLoadedImage
                  alt="profile-image"
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
                <LazyLoadedImage
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
              $alignItems="center"
            >
              <a
                href="placeholder_href"
                ref={downloadRef}
                download={pdfFileName}
                className="hide"
              >
                Placeholder
              </a>

              {canDownloadResume && (
                <>
                  <LazyLoadedImage
                    className="download"
                    alt="Click here"
                    width={25}
                    height={25}
                    onClick={downloadResume}
                    src={DownloadAnimation}
                    unoptimized
                    priority
                  />
                  <span className="download-text">
                    {download.download.message}
                  </span>
                </>
              )}
              {contactMe && <ContactMe />}
            </InterestedInProfile>
          </FlexBoxSection>
        </FlexBoxSection>
      </FlexBoxSection>
    </>
  );
};

export default About;
