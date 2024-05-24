import OfflineAnimation from "@/_assets/offline-animation.gif";
import { FlexBox } from "@/_components/common/Elements";
import LazyLoadedImage from "@/_components/common/LazyLoadedImage";
import "./styles.scss";

export default function Page() {
  return (
    <FlexBox
      $direction="column"
      $alignItems="center"
      $justifyContent="center"
      className="offline-page"
    >
      <FlexBox $alignItems="center" $gap={5}>
        <LazyLoadedImage
          src={OfflineAnimation}
          width={50}
          height={50}
          alt="Offline animation"
          unoptimized
        />
        <label>You seem to be offline</label>
      </FlexBox>
      <label>Please check your internet connection and try again</label>
    </FlexBox>
  );
}
