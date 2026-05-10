import useIsOnline from "@/_hooks/use-is-online";
import { FILE_DOWNLOAD_STATES } from "@/_store/common/types";
import { getPdfObjectUrl } from "@/_utils/profile/server";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface DownloadInput {
  /** Resume base64 payload used by the in-memory PDF builder. */
  base64: string;
  /** Pre-resolved PDF filename, when available. */
  pdfFileName: string | undefined;
}

interface DownloadHookResult {
  /** Hidden anchor used to trigger the browser download. */
  downloadRef: React.RefObject<HTMLAnchorElement | null>;
  /** Current download state machine value. */
  downloadState: FILE_DOWNLOAD_STATES;
  /** Whether the modal that surfaces in-progress / error / offline state should be visible. */
  showDownloadModal: boolean;
  /** Whether the user is currently online (passes through to the modal). */
  online: boolean;
  /** Currently-copied detail id, used to flash a "copied" indicator. */
  copyState: string;
  /** Imperatively update the copied detail id; auto-clears after a short delay. */
  setCopyState: React.Dispatch<React.SetStateAction<string>>;
  /** Reset the download state machine to `IDLE`. */
  resetDownloadState: () => void;
  /** Build the PDF locally from base64 and trigger a browser download. */
  downloadPDF: () => void;
  /** Fetch the resume PDF object URL from the server and trigger a download. */
  downloadResume: () => Promise<void>;
  /** Re-attempt `downloadResume` after a failure. */
  retryDownloadResume: () => Promise<void>;
}

/**
 * Encapsulates resume download/copy state used by the `About` section.
 *
 * @param input - Base64 payload and optional pre-resolved PDF filename.
 * @returns Refs, state and handlers required to render the download UI.
 */
export function useResumeDownload(input: DownloadInput): DownloadHookResult {
  const { base64, pdfFileName } = input;
  const [copyState, setCopyState] = useState<string>("");
  const [downloadState, setDownloadState] = useState(FILE_DOWNLOAD_STATES.IDLE);
  const online = useIsOnline();
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const showDownloadModal = useMemo(
    () =>
      [
        FILE_DOWNLOAD_STATES.INPROGRESS,
        FILE_DOWNLOAD_STATES.ERROR,
        FILE_DOWNLOAD_STATES.OFFLINE,
      ].some((item) => item === downloadState),
    [downloadState]
  );

  useEffect(() => {
    if (copyState) {
      setTimeout(() => {
        setCopyState("");
      }, 3000);
    }
  }, [copyState]);

  const resetDownloadState = useCallback(() => {
    setDownloadState(FILE_DOWNLOAD_STATES.IDLE);
  }, []);

  const downloadFile = (url: string) => {
    if (downloadRef.current !== null) {
      downloadRef.current.download = pdfFileName || "";
      downloadRef.current.href = url;
      downloadRef.current?.click();
    }
  };

  const downloadResume = async () => {
    if (online) {
      setDownloadState(FILE_DOWNLOAD_STATES.INPROGRESS);
      try {
        const fileObjectUrl = await getPdfObjectUrl(pdfFileName);
        downloadFile(fileObjectUrl);
        resetDownloadState();
      } catch (error) {
        setDownloadState(FILE_DOWNLOAD_STATES.ERROR);
      }
    } else {
      setDownloadState(FILE_DOWNLOAD_STATES.OFFLINE);
    }
  };

  async function retryDownloadResume() {
    setDownloadState(FILE_DOWNLOAD_STATES.RETRY);
    await downloadResume();
  }

  function downloadPDF() {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = Array.from(slice, (char) => char.charCodeAt(0));
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    const blob = new Blob(byteArrays, { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Pranesh_Resume.pdf";
    link.click();
  }

  return {
    downloadRef,
    downloadState,
    showDownloadModal,
    online,
    copyState,
    setCopyState,
    resetDownloadState,
    downloadPDF,
    downloadResume,
    retryDownloadResume,
  };
}
