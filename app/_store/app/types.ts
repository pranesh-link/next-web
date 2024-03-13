import {
  ILinkInfo,
  IPWA,
  IPreloadSrc,
  IPreloadedFile,
  IProfileData,
  ISectionInfo,
} from "@/_store/profile/types";
import {
  IAppConfig,
  IBMICalculatorFormInfo,
  IConfigDataParams,
  IMaintenance,
} from "../common/types";

export interface IAppContext {
  data: IAppConfigData;
}

export interface IAppConfigData {
  currentDevice: {
    osName: string;
    browserName: string;
    isMobile: boolean;
  };
  version: string;
  isAdmin: boolean;
  preloadedAssets: { id: string; image: string }[];
  preloadSrcList: IPreloadSrc[];
  profileData: IProfileData;
  hasError: boolean;
  pwa: IPWA;
  maintenance: IMaintenance;
  links: ILinkInfo;
  messages: IMessages;
  appConfig: IAppConfig;
  bmiCalculatorForm: IBMICalculatorFormInfo;
}

export interface IMessages {
  homepage: {
    title: string;
    underConstruction: string;
    redirection: string;
  };
}

export interface IWebServerConfig {
  devWebUrl: string;
  prodWebUrl: string;
}

export interface ICMSServerConfig {
  devCMSUrl: string;
  prodCMSUrl: string;
}

export type AppEnvironment = "development" | "production" | "test";
