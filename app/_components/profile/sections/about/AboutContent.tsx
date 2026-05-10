import { Desc, FlexBoxSection, SecHeader } from "@/_components/common/Elements";
import classNames from "classnames";
import AboutImage from "./AboutImage";

interface AboutContentProps {
  /** Whether the section is rendered in the export (PDF) layout. */
  isExport?: boolean;
  /** Whether the device is mobile. */
  isMobile: boolean;
  /** Raw HTML markup for the About paragraph (`dangerouslySetInnerHTML`). */
  aboutHtml: string;
}

/**
 * Render the textual About-Me content (header + body + mobile avatar).
 *
 * @param props - See {@link AboutContentProps}.
 * @returns The about-me column JSX.
 */
const AboutContent = (props: AboutContentProps) => {
  const { isExport, isMobile, aboutHtml } = props;
  return (
    <FlexBoxSection
      $direction="column"
      className={classNames("about-me", "about-flex-grow", {
        export: isExport,
      })}
    >
      {!isExport && (
        <SecHeader className="about-section-header">About Me</SecHeader>
      )}

      {!isExport && isMobile && (
        <AboutImage
          size={150}
          borderColor="rgba(20, 184, 166, 0.3)"
        />
      )}

      <div
        className={classNames("about-content-text", { "is-mobile": isMobile })}
      >
        <Desc
          className="about about-desc-reset"
          dangerouslySetInnerHTML={{ __html: aboutHtml }}
        />
      </div>
    </FlexBoxSection>
  );
};

export default AboutContent;
