import {
  ExpandableInfosType,
  IProfileConfigData,
  IProfileContext,
  IPWA,
  ShortInfosType,
} from "@/_store/profile/types";
import React from "react";

export const CORS_MODE = "cors";
export const TOAST_POSITION = "top-center";
export const MESSAGES = {
  genericError: "Something went wrong!",
};

export const SHORT_INFOS: ShortInfosType[] = [
  "client",
  "duration",
  "role",
  "softwareTech",
];
export const EXPANDABLE_INFOS: ExpandableInfosType[] = ["description"];
export const LINKS = {
  NEXT_JS_LIBRARY: "https://www.npmjs.com/package/next",
};

export const DEFAULT_PWA: IPWA = {
  messages: {
    install: "",
    yes: "",
    no: "",
    open: "",
    relatedApp: "",
    installApp: "",
    openApp: "",
  },
  bannerExpiryTime: 0,
};

export const DEFAULT_PROFILE_CONTEXT: IProfileContext = {
  data: {
    labels: {},
    header: {
      shortDesc: "",
      name: "",
      currentJobRole: "",
    },
    forms: {
      contactForm: {
        header: "",
        transformFields: [],
        key: "",
        defaultMaxLength: 20,
        actionButtonLabel: "",
        label: {},
        statusMessages: {
          success: "",
          error: "",
          form_fill: "",
          sending: "",
          offline: "",
          review: "",
        },
        messages: {
          mandatoryError: "",
        },
        name: "",
        fields: [],
      },
    },
    sections: {
      aboutMe: {
        title: "",
        info: "",
      },
      details: {
        title: "",
        info: [],
      },
      skills: {
        title: "",
        info: [],
      },
      experiences: {
        title: "",
        info: [],
      },
      education: {
        title: "",
        info: "",
      },
      links: {
        title: "",
        info: [],
      },
      openSourceProjects: {
        title: "",
        info: [],
      },
    },
    download: {
      type: "",
      base64: "",
      staticFileUrl: "",
      messages: {},
      download: {
        message: "",
        icon: "",
      },
      downloading: {
        message: "",
        icon: "",
      },
      downloaded: {
        message: "",
        icon: "",
      },
    },
  },
  pwaOffset: 0,
  isDarkMode: false,
  showComponentLibUrl: true,
  refs: {
    homeRef: React.createRef(),
    skillsRef: React.createRef(),
    experienceRef: React.createRef(),
    educationRef: React.createRef(),
    contactRef: React.createRef(),
    openSourceRef: React.createRef(),
  },
  deviceConfig: {
    browserName: "",
    osName: "",
    os: [],
    browsers: [],
  },
  appVersion: "",
  preloadedAssets: [],
  preloadSrcList: [],
  currentSection: "about",
  isExport: false,
  isDownloading: false,
  isMobile: false,
  isInstallBannerOpen: false,
  isContactFormOpen: false,
  isModalOpen: false,
  setIsModalOpen: () => {},
  setIsContactFormOpen: () => {},
  emailJsConfig: {
    serviceId: "",
    templateId: "",
    publicKey: "",
  },
};

export const LABEL_TEXT: Record<string, string> = {
  client: "Client",
  duration: "Duration",
  description: "Description",
  responsibilities: "Responsibilities",
  softwareTech: "Software/Technologies",
  role: "Role",
  retry: "Retry",
  retrying: "Retrying...",
  close: "Close",
  developedUsing: "Developed using <a href='{0}' target='_blank'> next </a>",
};

export const SECTIONS = {
  COMBINED: "profile-sections",
  HEADER: "header",
  ABOUT_ME: "aboutMe",
  DETAILS: "details",
  EDUCATION: "education",
  ORGANIZATIONS: "organizations",
  SKILLS: "skills",
  EXPERIENCE: "experiences",
  LINKS: "links",
  DOWNLOAD: "download",
  RESUME_EXPERIENCES: "resume-experiences",
  OPEN_SOURCE_PROJECTS: "openSourceProjects",
};

export const FORMS = {
  CONTACT_FORM: "contact-form",
};

export const SECTION_ORDER_DISPLAY: Record<
  string,
  { order: number; display?: boolean }
> = {
  ABOUTME: { order: 1 },
  EDUCATION: { order: 4 },
  ORGANIZATIONS: { order: 3, display: false },
  SKILLS: { order: 2 },
  EXPERIENCES: { order: 5 },
  CONTACT: { order: 7 },
  OPENSOURCEPROJECTS: { order: 6 },
};

export const LABELS = {
  PROJECTS: "Projects",
  CLIENTS: "Clients",
  RESPONSIBILITIES: "Responsibilities",
  CLIENT: "Client",
};

export const EXPERIENCE_TYPES = {
  CURRENT: "Current",
  PREVIOUS: "Previous",
};

export const FIELD_TYPES = {
  TEXT: "text",
  MOBILE: "mobile",
  CHECKBOX: "checkbox",
  TEXTAREA: "textarea",
};

export const FIELD_SUB_TYPES = {
  EMAIL: "email",
};

export const DEFAULT_PROFILE_CONFIG_DATA: IProfileConfigData = {
  profileSections: {
    header: DEFAULT_PROFILE_CONTEXT.data.header,
    aboutMe: DEFAULT_PROFILE_CONTEXT.data.sections.aboutMe,
    education: DEFAULT_PROFILE_CONTEXT.data.sections.education,
    details: DEFAULT_PROFILE_CONTEXT.data.sections.details,
    experiences: DEFAULT_PROFILE_CONTEXT.data.sections.experiences,
    openSourceProjects:
      DEFAULT_PROFILE_CONTEXT.data.sections.openSourceProjects,
  },
  links: DEFAULT_PROFILE_CONTEXT.data.sections.links,
  download: DEFAULT_PROFILE_CONTEXT.data.download,
  skills: DEFAULT_PROFILE_CONTEXT.data.sections.skills,
  contactForm: DEFAULT_PROFILE_CONTEXT.data.forms.contactForm,
  profileLabels: DEFAULT_PROFILE_CONTEXT.data.labels,
};

export const CONFIG_REF_INFO = {
  ref: "config.json",
  name: "config",
};

export const CONFIG_TYPES = {
  APPCONFIG: "appConfig",
  PROFILECONFIG: "profileConfig",
};

export const SERVER_FILES_LOC = "/files";
export const YES = "Yes";
export const NO = "No";

const exports = {
  CONFIG_REF_INFO,
  CONFIG_TYPES,
  CORS_MODE,
  DEFAULT_PROFILE_CONFIG_DATA,
  DEFAULT_PROFILE_CONTEXT,
  DEFAULT_PWA,
  EXPANDABLE_INFOS,
  EXPERIENCE_TYPES,
  FIELD_SUB_TYPES,
  FIELD_TYPES,
  FORMS,
  LABELS,
  LABEL_TEXT,
  LINKS,
  MESSAGES,
  NO,
  SECTIONS,
  SECTION_ORDER_DISPLAY,
  SERVER_FILES_LOC,
  SHORT_INFOS,
  TOAST_POSITION,
  YES,
};

export default exports;
