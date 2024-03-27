import { memo } from "react";
import { ProgressMessage } from "./Elements";
import classNames from "classnames";
import StatusIcon from "./StatusIcon";

function StatusIconMessage({
  message,
  isOffline,
  icon,
}: {
  isOffline: boolean;
  message: string;
  icon: string;
}) {
  return (
    <>
      {icon && <StatusIcon icon={icon} />}
      <ProgressMessage
        className={classNames({ offline: isOffline })}
        dangerouslySetInnerHTML={{ __html: message }}
      />
    </>
  );
}

export default memo(StatusIconMessage);
