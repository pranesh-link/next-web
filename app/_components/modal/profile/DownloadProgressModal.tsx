import { AppContext } from "@/_store/app/context";
import { FILE_DOWNLOAD_STATES } from "@/_store/common/types";
import classNames from "classnames";
import { useContext, useMemo } from "react";
import CustomModalComponent from "../../common/ModalComponent";
import ProgressBar from "../../common/ProgressBar";
import { Retry } from "../../form/Elements";
import { DownloadingFileMessage } from "../../profile/sections/Elements";

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
        common: { offline, retry },
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

  const hideRetry = useMemo(
    () =>
      [FILE_DOWNLOAD_STATES.OFFLINE, FILE_DOWNLOAD_STATES.ERROR].every(
        (item) => item !== downloadState
      ),
    [downloadState]
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
            hide: hideRetry,
          })}
          onClick={(e) => {
            e.preventDefault();
            retryDownload();
          }}
        >
          {retry}
        </Retry>
      </DownloadingFileMessage>
    </CustomModalComponent>
  );
}
