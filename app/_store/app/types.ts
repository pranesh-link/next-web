import { ILinkInfo, IPreloadSrc } from "@/_store/profile/types";
import {
  IAppConfig,
  IBMICalculatorFormInfo,
  IMaintenance,
} from "../common/types";

export interface IAppContext {
  data: IAppConfigData;
}

export interface IAppConfigData {
  features: {
    pwa: boolean;
    downloadResume: boolean;
    contactMe: boolean;
  };
  currentDevice: {
    osName: string;
    browserName: string;
    isMobile: boolean;
  };
  version: string;
  isAdmin: boolean;
  preloadSrcList: IPreloadSrc[];
  hasError: boolean;
  maintenance: IMaintenance;
  links: ILinkInfo;
  messages: IMessages;
  appConfig: IAppConfig;
  bmiCalculatorForm: IBMICalculatorFormInfo;
}

export interface IMessages {
  common: {
    offline: string;
    retry: string;
  };
}
