import Image from "next/image";
import { memo } from "react";

function StatusIcon({ icon }: { icon: string }) {
  return (
    <Image
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
