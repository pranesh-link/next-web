import { memo } from "react";
import LazyLoadedImage from "../common/LazyLoadedImage";

function StatusIcon({ icon }: { icon: string }) {
  return (
    <LazyLoadedImage
      className="form-status-image"
      alt="Form status"
      height={35}
      width={35}
      src={icon}
      unoptimized
    />
  );
}

export default memo(StatusIcon);
