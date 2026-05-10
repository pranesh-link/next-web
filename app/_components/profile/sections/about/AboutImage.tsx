import DisplayPic from "@/_assets/display-pic.png";
import { FlexBoxSection } from "@/_components/common/Elements";
import LazyLoadedImage from "@/_components/common/LazyLoadedImage";
import classNames from "classnames";

interface AboutImageProps {
  /** Diameter (px) of the circular avatar. */
  size: number;
  /** Border tint color rgba string for the circular frame. */
  borderColor: string;
  /** Right-margin override for desktop layouts. */
  marginRight?: string;
  /** When true, attach hover scale/glow handlers (used on desktop). */
  enableHover?: boolean;
  /** When true, pass the `unoptimized` flag to next/image. */
  unoptimized?: boolean;
}

/**
 * Render the circular profile avatar used inside the About section.
 *
 * @param props - See {@link AboutImageProps}.
 * @returns The avatar JSX.
 */
const AboutImage = (props: AboutImageProps) => {
  const { size, borderColor, marginRight, enableHover, unoptimized } = props;
  const hasMarginRight = !!marginRight && marginRight !== "0";
  const isTealTint = borderColor === "rgba(20, 184, 166, 0.3)";
  const sizeClass =
    size === 200 ? "size-200" : size === 150 ? "size-150" : undefined;

  return (
    <FlexBoxSection
      $justifyContent="center"
      className={classNames("image", "about-image-flex", {
        "has-margin-right": hasMarginRight,
        "has-margin-bottom": !enableHover,
      })}
    >
      <div
        className={classNames("image-wrap", "about-image-wrap", sizeClass, {
          "tint-teal": isTealTint,
          "has-hover": enableHover,
        })}
      >
        <LazyLoadedImage
          alt="profile-image"
          className="profile-image"
          width={size}
          height={size}
          src={DisplayPic}
          unoptimized={unoptimized}
          priority
        />
      </div>
    </FlexBoxSection>
  );
};

export default AboutImage;
