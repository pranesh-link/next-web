import DownloadAnimation from "@/_assets/download.gif";
import ContactMe from "@/_components/common/ContactMe";
import LazyLoadedImage from "@/_components/common/LazyLoadedImage";
import { InterestedInProfile } from "../../Elements";

interface DownloadResumeBlockProps {
  /** Whether the device is mobile (controls layout via the styled wrapper). */
  isMobile: boolean;
  /** Whether the resume download CTA is disabled. */
  disabled?: boolean;
  /** Filename used by the hidden anchor's `download` attribute. */
  pdfFileName: string | undefined;
  /** Hidden anchor ref used to trigger downloads. */
  downloadRef: React.Ref<HTMLAnchorElement>;
  /** Click handler that builds the PDF locally and triggers the browser download. */
  onDownloadPdf: () => void;
  /** Animated CTA text shown next to the download icon. */
  message: string;
  /** When true, render the floating Contact Me action next to the CTA. */
  contactMeEnabled: boolean;
}

/**
 * Render the resume download CTA + optional contact entry shown in the About section.
 *
 * @param props - See {@link DownloadResumeBlockProps}.
 * @returns The CTA block JSX.
 */
const DownloadResumeBlock = (props: DownloadResumeBlockProps) => {
  const {
    isMobile,
    disabled,
    pdfFileName,
    downloadRef,
    onDownloadPdf,
    message,
    contactMeEnabled,
  } = props;

  return (
    <InterestedInProfile
      $isMobile={isMobile}
      $disabled={disabled}
      $alignItems="center"
      className="download-block"
    >
      <a
        href="placeholder_href"
        ref={downloadRef}
        download={pdfFileName}
        className="hide"
      >
        Placeholder
      </a>

      <div className="download-trigger" onClick={onDownloadPdf}>
        <div className="download-icon-wrap">
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
        <span className="download-text download-text-styled">
          {message}
        </span>
      </div>

      {contactMeEnabled && (
        <div className="contact-me-wrap">
          <ContactMe />
        </div>
      )}
    </InterestedInProfile>
  );
};

export default DownloadResumeBlock;
