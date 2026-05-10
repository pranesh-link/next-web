import {
  IAboutMeInfo,
  IDetailInfo,
  IEducationInfo,
  IExperienceInfo,
  ILinkInfo,
  IOpenSourceInfo,
  ISections,
  ISkillInfo,
} from "./section";
import { DownloadType, IDeviceConfig, IEmailJsConfig, IPreloadSrc, IPreloadedAsset } from "./misc";
import { FormsType, IFormInfo } from "./form";

/** Header content rendered at the top of the profile. */
export interface IHeader {
  /** Short descriptor/tagline. */
  shortDesc: string;
  /** Display name. */
  name: string;
  /** Current job role. */
  currentJobRole: string;
  /** Optional greeting text. */
  greeting?: string;
  /** Optional tagline text. */
  tagline?: string;
}

/** Top-level profile data tree consumed by the UI. */
export interface IProfileData {
  /** Header content. */
  header: IHeader;
  /** Section descriptors. */
  sections: ISections;
  /** Resume download configuration. */
  download: DownloadType;
  /** Form descriptors. */
  forms: FormsType;
  /** Arbitrary label bundle. */
  labels: Record<string, string>;
}

/** Identifiers for refs used to scroll between profile sections. */
export type RefTypes =
  | "homeRef"
  | "skillsRef"
  | "experienceRef"
  | "educationRef"
  | "contactRef"
  | "openSourceRef";

/** Internal grouping of profile sections used by the config payload. */
interface IProfileSections {
  /** Header content. */
  header: IHeader;
  /** About-me section. */
  aboutMe: IAboutMeInfo;
  /** Education section. */
  education: IEducationInfo;
  /** Contact details section. */
  details: IDetailInfo;
  /** Experiences section. */
  experiences: IExperienceInfo;
  /** Open-source projects section. */
  openSourceProjects: IOpenSourceInfo;
}

/** Raw configuration payload returned by the profile config API. */
export interface IProfileConfigData {
  /** Grouped profile sections. */
  profileSections: IProfileSections;
  /** Links section. */
  links: ILinkInfo;
  /** Resume download configuration. */
  download: DownloadType;
  /** Skills section. */
  skills: ISkillInfo;
  /** Contact form descriptor. */
  contactForm: IFormInfo;
  /** Profile-wide labels. */
  profileLabels: Record<string, string>;
}

/** React context value shared across profile components. */
export interface IProfileContext {
  /** Profile data tree. */
  data: IProfileData;
  /** Section refs used for scroll navigation. */
  refs: {
    [key in RefTypes]: React.MutableRefObject<any>;
  };
  /** Detected device configuration. */
  deviceConfig: IDeviceConfig;
  /** Files queued for preloading. */
  preloadSrcList: IPreloadSrc[];
  /** Already-preloaded image assets. */
  preloadedAssets: IPreloadedAsset[];
  /** Currently visible section identifier. */
  currentSection: string;
  /** Current app version string. */
  appVersion: string;
  /** Whether dark mode is active. */
  isDarkMode: boolean;
  /** Whether the page is being rendered for export (e.g. PDF). */
  isExport?: boolean;
  /** Whether a download is in progress. */
  isDownloading?: boolean;
  /** Whether the viewport is mobile-sized. */
  isMobile: boolean;
  /** Whether to display the component library URL. */
  showComponentLibUrl: boolean;
  /** Whether the install banner is open. */
  isInstallBannerOpen: boolean;
  /** Whether the contact form modal is open. */
  isContactFormOpen: boolean;
  /** Whether any modal is open. */
  isModalOpen: boolean;
  /** EmailJS credentials. */
  emailJsConfig: IEmailJsConfig;
  /** Vertical offset reserved for the PWA banner (px). */
  pwaOffset: number;
  /** Setter for the contact-form open state. */
  setIsContactFormOpen: (isContactFormOpen: boolean) => void;
  /** Setter for the modal open state. */
  setIsModalOpen: (isModalOpen: boolean) => void;
}
