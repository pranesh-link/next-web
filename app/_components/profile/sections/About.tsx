import DisplayPic from "@/_assets/display-pic.png";
import DownloadAnimation from "@/_assets/download.gif";
import ContactMe from "@/_components/common/ContactMe";
import { Desc, FlexBoxSection, SecHeader } from "@/_components/common/Elements";
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
      features: { contactMe },
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

  function downloadPDF() {
    const byteCharacters = atob(download.base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = Array.from(slice, (char) => char.charCodeAt(0));
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    const blob = new Blob(byteArrays, { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Pranesh_Resume.pdf";
    link.click();
  }

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
        style={{
          background: isExport ? 'transparent' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: isExport ? '0' : '24px',
          backdropFilter: isExport ? 'none' : 'blur(20px)',
          border: isExport ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
          padding: isExport ? '0' : '40px',
          margin: isExport ? '0' : '20px',
          boxShadow: isExport ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {!isExport && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              borderRadius: '24px 24px 0 0'
            }}
          />
        )}
        
        <FlexBoxSection
          $direction="column"
          className={classNames("about-me", { export: isExport })}
          style={{ flex: 1 }}
        >
          {!isExport && (
            <SecHeader style={{ marginBottom: '32px' }}>
              About Me
            </SecHeader>
          )}
          
          {!isExport && isMobile && (
            <FlexBoxSection
              $justifyContent="center"
              className="image"
              style={{ marginBottom: '24px' }}
            >
              <div 
                className="image-wrap"
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid rgba(20, 184, 166, 0.3)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease'
                }}
              >
                <LazyLoadedImage
                  alt="profile-image"
                  className="profile-image"
                  width={150}
                  height={150}
                  src={DisplayPic}
                  priority
                />
              </div>
            </FlexBoxSection>
          )}
          
          <div
            style={{
              color: '#4a5568',
              lineHeight: 1.7,
              fontSize: '16px',
              textAlign: isMobile ? 'center' : 'left'
            }}
          >
            <Desc
              className="about"
              dangerouslySetInnerHTML={{ __html: aboutMe.info as string }}
              style={{ margin: 0 }}
            />
          </div>
        </FlexBoxSection>
        
        <FlexBoxSection $alignItems="center" className="image-details-wrap">
          {(!isMobile || isExport) && (
            <FlexBoxSection
              $justifyContent="center"
              className="image"
              style={{ marginRight: isMobile ? '0' : '40px' }}
            >
              <div 
                className="image-wrap"
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid rgba(102, 126, 234, 0.3)',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                }}
              >
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
          
          <FlexBoxSection $direction="column" style={{ flex: 1 }}>
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
              style={{
                background: 'transparent',
                padding: '16px 0',
                borderRadius: '0',
                margin: '20px 0',
                boxShadow: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              <a
                href="placeholder_href"
                ref={downloadRef}
                download={pdfFileName}
                className="hide"
              >
                Placeholder
              </a>

              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  color: '#0f766e',
                  cursor: 'pointer'
                }}
                onClick={downloadPDF}
              >
                <div style={{ 
                  marginRight: '12px'
                }}>
                  <LazyLoadedImage
                    className="download"
                    alt="Click here"
                    width={25}
                    height={25}
                    src={DownloadAnimation}
                    unoptimized
                    priority
                  />
                </div>
                <span 
                  className="download-text"
                  style={{
                    fontWeight: '600',
                    fontSize: '16px',
                    color: '#0f766e'
                  }}
                >
                  {download.download.message}
                </span>
              </div>
              
              {contactMe && (
                <div style={{ marginLeft: '16px' }}>
                  <ContactMe />
                </div>
              )}
            </InterestedInProfile>
          </FlexBoxSection>
        </FlexBoxSection>
      </FlexBoxSection>
    </>
  );
};

export default About;
