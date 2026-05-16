/** Stages of the resume download lifecycle. */
type DownloadStages = "download" | "downloading" | "downloaded";

/** Resume download configuration with per-stage UI metadata and file info. */
export type DownloadType = {
  [key in DownloadStages]: {
    /** Whether the stage button is disabled. */
    disabled?: boolean;
    /** Display message for this stage. */
    message: string;
    /** Icon identifier for this stage. */
    icon: string;
  };
} & {
  /** MIME or label for the downloadable file. */
  type: string;
  /** Arbitrary string messages keyed by id. */
  messages: Record<string, string>;
  /** URL of the static file to download. */
  staticFileUrl: string;
  /** Base64-encoded file payload. */
  base64: string;
};

/** A file that has been preloaded into memory. */
export interface IPreloadedFile {
  /** Stable identifier. */
  id: string;
  /** Loaded file payload. */
  file: any;
}

/** Descriptor for a file to preload. */
export interface IPreloadSrc {
  /** Stable identifier. */
  id: string;
  /** File MIME or kind. */
  type: string;
  /** File name. */
  fileName: string;
  /** File location/URL. */
  fileLocation: string;
}

/** Detected device/browser/OS configuration. */
export interface IDeviceConfig {
  /** Browsers matched. */
  browsers: string[];
  /** Operating systems matched. */
  os: string[];
  /** Resolved OS name. */
  osName: string;
  /** Resolved browser name. */
  browserName: string;
}

/** A preloaded image asset. */
export interface IPreloadedAsset {
  /** Stable identifier. */
  id: string;
  /** Image source (URL or data URI). */
  image: string;
}

/** EmailJS service credentials. */
export interface IEmailJsConfig {
  /** EmailJS service id. */
  serviceId: string;
  /** EmailJS template id. */
  templateId: string;
  /** EmailJS public key. */
  publicKey: string;
}
