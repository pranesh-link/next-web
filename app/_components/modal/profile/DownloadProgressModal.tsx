import { FILE_DOWNLOAD_STATES } from "@/_store/common/types";
import CustomModalComponent from "../../common/ModalComponent";
import { DownloadingFileMessage } from "../../profile/sections/Elements";
import ProgressBar from "../../common/ProgressBar";
import classNames from "classnames";
import { Retry } from "../../form/Elements";
import { LABEL_TEXT } from "@/_constants/profile";
import { useContext, useMemo } from "react";
import { AppContext } from "@/_store/app/context";

interface IDownloadProgressModalProps {
  showModal: boolean;
  online: boolean;
  downloadState: FILE_DOWNLOAD_STATES;
  downloadMessages: Record<string, string>;
  retryDownload: () => void;
  resetState: () => void;
}
export default function DownloadProgressModal(
  props: IDownloadProgressModalProps
) {
  const {
    showModal: showDownloadModal,
    online,
    downloadState,
    downloadMessages,
    retryDownload,
    resetState,
  } = props;
  const {
    data: {
      messages: {
        common: { offline },
      },
    },
  } = useContext(AppContext);

  const downloadInProgressMessage = useMemo(
    () =>
      downloadState === FILE_DOWNLOAD_STATES.OFFLINE
        ? offline
        : downloadMessages[downloadState],
    [downloadMessages, downloadState, offline]
  );

  return (
    <CustomModalComponent
      isOpen={showDownloadModal}
      onRequestClose={resetState}
    >
      <DownloadingFileMessage className={classNames({ offline: !online })}>
        <p
          dangerouslySetInnerHTML={{
            __html: downloadInProgressMessage,
          }}
        />
        {downloadState === FILE_DOWNLOAD_STATES.INPROGRESS && <ProgressBar />}
        <Retry
          href=""
          className={classNames({
            hide: downloadState !== FILE_DOWNLOAD_STATES.OFFLINE,
          })}
          onClick={(e) => {
            e.preventDefault();
            retryDownload();
          }}
        >
          {LABEL_TEXT.retry}
        </Retry>
      </DownloadingFileMessage>
    </CustomModalComponent>
  );
}
