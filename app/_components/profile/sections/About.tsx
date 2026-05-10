import { FlexBoxSection } from "@/_components/common/Elements";
import ContactModal from "@/_components/modal/profile/ContactModal";
import DownloadProgressModal from "@/_components/modal/profile/DownloadProgressModal";
import { AppContext } from "@/_store/app/context";
import { ProfileContext } from "@/_store/profile/page/context";
import classNames from "classnames";
import { useContext } from "react";
import AboutContent from "./about/AboutContent";
import AboutImage from "./about/AboutImage";
import AboutMeDetails from "./AboutMeDetails";
import DownloadResumeBlock from "./about/DownloadResumeBlock";
import { useResumeDownload } from "./about/use-resume-download";

interface IAboutProps {
  /** Trigger to export/download the rendered profile (currently unused by `About`). */
  exportProfile: () => void;
}

/**
 * Render the About profile section: avatar, intro paragraph, contact details and resume CTA.
 *
 * @param _props - See {@link IAboutProps}.
 * @returns The About section JSX (including modals it owns).
 */
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

  const {
    downloadRef,
    downloadState,
    showDownloadModal,
    online,
    copyState,
    setCopyState,
    resetDownloadState,
    downloadPDF,
    retryDownloadResume,
  } = useResumeDownload({ base64: download.base64, pdfFileName });

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
        {!isExport && <div className="about-accent-strip" />}

        <AboutContent
          isExport={isExport}
          isMobile={isMobile}
          aboutHtml={aboutMe.info as string}
        />

        <FlexBoxSection $alignItems="center" className="image-details-wrap">
          {(!isMobile || isExport) && (
            <AboutImage
              size={200}
              borderColor="rgba(102, 126, 234, 0.3)"
              marginRight={isMobile ? "0" : "40px"}
              enableHover
              unoptimized
            />
          )}

          <FlexBoxSection
            $direction="column"
            className="about-flex-grow"
          >
            <AboutMeDetails
              copyState={copyState}
              setCopyState={(copyInfoId: string) => {
                setCopyState(copyInfoId);
              }}
            />
            <DownloadResumeBlock
              isMobile={isMobile}
              disabled={download.download.disabled}
              pdfFileName={pdfFileName}
              downloadRef={downloadRef}
              onDownloadPdf={downloadPDF}
              message={download.download.message}
              contactMeEnabled={contactMe}
            />
          </FlexBoxSection>
        </FlexBoxSection>
      </FlexBoxSection>
    </>
  );
};

export default About;
