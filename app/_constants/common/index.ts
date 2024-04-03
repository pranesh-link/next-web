import { DEFAULT_PROFILE_CONTEXT, DEFAULT_PWA } from "@/_constants/profile";
import { IAppContext } from "@/_store/app/types";
import { IConfigData, IMaintenance } from "@/_store/common/types";

export const ROUTES: Record<string, string> = {
  ROUTE_HOME: "/",
  ROUTE_PROFILE: "/profile",
  ROUTE_MAINTENANCE: "/maintenance",
  ROUTE_BMICALCULATOR: "/tools/bmi-calculator",
};

export const PAGE_TITLES = {
  home: "Pranesh | Lead UI Engineer",
  profile: "Pranesh | Lead UI Engineer",
  bmiCalculator: "BMI Calculator",
};

export const DEFAULT_MAINTENANCE_DATA: IMaintenance = {
  isUnderMaintenance: false,
  message: "",
  image: "",
};

export const DEFAULT_APP_CONTEXT: IAppContext = {
  data: {
    bmiCalculatorForm: {
      name: "bmi-calculator",
      header: "",
      fields: [],
      key: "",
      actionButtonLabel: "",
      defaultMaxLength: 3,
      label: {},
      messages: { mandatoryError: "" },
      statusMessages: {
        error: "",
        form_fill: "",
        offline: "",
        review: "",
        sending: "",
        success: "",
      },
      permissibleHeights: {
        min: 50,
        max: 350,
      },
      permissibleWeights: {
        min: 2,
        max: 700,
      },
      bmiRanges: [
        {
          id: "underWeight",
          max: 18.5,
          label: "Underweight",
          prefixedPercentile: 0,
          color: "#3498db",
        },
      ],
      transformFields: [],
    },
    currentDevice: {
      osName: "Android",
      browserName: "Chrome",
      isMobile: false,
    },
    version: "1.0.0",
    isAdmin: false,
    preloadSrcList: [],
    messages: {
      common: {
        offline: "",
        retry: "",
      },
    },
    hasError: false,
    links: DEFAULT_PROFILE_CONTEXT.data.sections.links,
    pwa: DEFAULT_PWA,
    maintenance: DEFAULT_MAINTENANCE_DATA,
    appConfig: {
      notFoundPage: {
        title: "",
      },
      labels: {},
      homepage: {
        title: "",
        profileRedirectDelay: 3,
        pages: [],
      },
      pwa: {
        browsers: [],
        os: [],
      },
      preloadSrcList: [],
    },
  },
};

export const EMAILJS_CONFIG = {
  SERVICE_ID: "U2FsdGVkX1+/Ekcp8WIEIevCcut8R0pL2cDmNPDFEQg=",
  TEMPLATE_ID:
    "U2FsdGVkX1+WVTFxJh0xy9cHz88fqnR1GURfEw0qLwV60o1uRo6hB12u8pNe5ody",
  PUBLIC_KEY:
    "U2FsdGVkX1/M46+97vn9sj2D3LbKO9dKmwqIO+Zh21fONTOa8xN+aMKg0/zeLgj6",
};

export const DEFAULT_BMI_CALCULATOR_FORM_DATA = {
  heightInCm: "",
  weightInKg: "",
};

export const DEFAULT_BMI_CALCULATOR_FORM_ERROR =
  DEFAULT_BMI_CALCULATOR_FORM_DATA;

export const DEFAULT_CONFIG_DATA: IConfigData = {
  jsonConfig: {
    defaultConfig: [
      {
        name: "maintenance",
        type: "",
        ref: "",
      },
    ],
    profileConfig: [
      {
        name: "profileSections",
        type: "",
        ref: "",
      },
    ],
  },
  appConfig: {
    notFoundPage: {
      title: "",
    },
    labels: {},
    homepage: {
      title: "",
      pages: [],
      profileRedirectDelay: 2,
    },
    pwa: {
      browsers: [],
      os: [],
    },
    preloadSrcList: [],
  },
};

export const HEADER_INFO = {
  METADATA: {
    title: PAGE_TITLES.profile,
    description:
      "Exemplary Lead UI Engineer, an aspiring Architect to be specializing in React, HTML, CSS, and JavaScript. Dedicated to creating exceptional user interfaces that seamlessly blend form and function. Proven leadership in guiding teams to deliver cutting-edge web experiences.",
    keywords:
      "ui, web, lead engineer, ui architect, react, next, html, css, javascript, typescript",
  },
  VIEWPORT: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: true,
  },
};
