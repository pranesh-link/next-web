import {
  CMS_SERVER_CONFIG,
  DEFAULT_APP_CONTEXT,
  ENVIRONMENT,
} from "@/_constants/common";
import {
  CONFIG_REF_INFO,
  CONFIG_TYPES,
  DEFAULT_PROFILE_CONFIG_DATA,
  DEFAULT_PROFILE_CONTEXT,
} from "@/_constants/profile";
import mockProfileData from "@/_mock/profile";
import { IAppConfigData } from "@/_store/app/types";
import {
  IConfigData,
  IConfigDataParams,
  IPageLink,
  IPageLinkCollection,
} from "@/_store/common/types";
import {
  Environment,
  ICMSServerConfig,
  IHeader,
  ISectionInfo,
  DownloadType,
  IFormInfo,
  IPreloadSrc,
  IProfileConfigData,
  IExperienceJsonInfo,
  IExperience,
  IProfileData,
} from "@/_store/profile/types";

export const getImage = async (fileName: string, id: string) => {
  const image = await import(`@/_assets/${fileName}`);
  return { id, image: image.default.src };
};

export const round = (value: number, precision: number) => {
  const multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
};

export const findAndReplace = (
  str: string = "",
  replaceText: (string | number)[]
) => {
  const textsToReplace = str.match(/{(.*?)}/g) || [];
  return textsToReplace.reduce(
    (curr, prev, index) => curr.replace(prev, `${replaceText[index]}`),
    str
  );
};

export const isInstanceOfPageLink = (item: any): item is IPageLink =>
  "route" in item;

export const isInstanceOfPageLinkCollection = (
  item: any
): item is IPageLinkCollection => "links" in item;

export const getServerBaseUrl = (
  env: Environment,
  cmsConfig: ICMSServerConfig
) => (env === "development" ? cmsConfig.devCMSUrl : cmsConfig.prodCMSUrl);

export const getJsonResponse = async (
  env: Environment,
  jsonToFetch: string,
  cmsServerConfig: ICMSServerConfig,
  data?: any
) => {
  const JSON_BASE_URL = getServerBaseUrl(env, cmsServerConfig);
  let hasError = false;
  data = data || {};
  try {
    const url = `${JSON_BASE_URL}/${jsonToFetch}`;
    const response = await fetch(url, {
      mode: "cors",
    });
    data = await response.json();
  } catch (e) {
    hasError = true;
  }
  return { data, hasError };
};

export const getProfileJsonResponse = async (
  env: Environment,
  jsonToFetch: string,
  cmsServerConfig: ICMSServerConfig,
  data: IHeader | ISectionInfo | DownloadType | IFormInfo
) => getJsonResponse(env, jsonToFetch, cmsServerConfig, data);

async function fetchSection(
  jsonToFetch: string,
  data: ISectionInfo | IHeader | DownloadType,
  name: string,
  hasError: boolean
) {
  const response = await getProfileJsonResponse(
    ENVIRONMENT,
    jsonToFetch,
    CMS_SERVER_CONFIG,
    data
  );
  hasError = response.hasError;
  return {
    name,
    data: response.data as ISectionInfo,
  };
}

async function fetchData(jsonToFetch: string, name: string, hasError: boolean) {
  const response = await getJsonResponse(
    ENVIRONMENT,
    jsonToFetch,
    CMS_SERVER_CONFIG
  );
  hasError = response.hasError;
  return { name, data: response.data };
}

export const fetchBaseConfig = async (
  basicConfigData: IAppConfigData,
  hasError: boolean
) => {
  let config: any = (
    (await fetchData(
      CONFIG_REF_INFO.ref,
      CONFIG_REF_INFO.name,
      hasError
    )) as unknown as {
      data: IConfigData;
    }
  ).data;

  const { jsonConfig, appConfig } = config;
  const configData = await Promise.all(
    (jsonConfig?.defaultConfig || []).map((data: IConfigDataParams) => {
      const { name, type, ref } = data;
      return type === CONFIG_TYPES.PROFILECONFIG
        ? fetchSection(ref, basicConfigData.links, name, hasError)
        : fetchData(ref, name, hasError);
    })
  );
  basicConfigData = {
    ...configData.reduce(
      (curr, prev) => ({ ...curr, [prev.name]: prev.data }),
      basicConfigData
    ),
    appConfig,
  };

  return {
    data: basicConfigData,
    hasError,
    jsonConfig,
    preloadSrcList: appConfig?.preloadSrcList,
  };
};

export const fetchImages = async (preloadSrcList: IPreloadSrc[]) => {
  const preloadedAssetImages = [];

  for (const item of preloadSrcList || []) {
    if (item.type === "image") {
      const image = await getImage(item.fileName, item.id);
      preloadedAssetImages.push(image);
    }
  }
  return preloadedAssetImages;
};

export const fetchProfileData = async (
  jsonConfig: IConfigData["jsonConfig"],
  profileData: IProfileData,
  hasError: boolean
) => {
  const DEFAULT_SECTIONS_DETAILS =
    DEFAULT_PROFILE_CONTEXT.data.sections.details;
  const {
    profileSections,
    links,
    skills,
    download,
    contactForm,
    profileLabels,
  } = (
    await Promise.all(
      (jsonConfig?.profileConfig || []).map((data: IConfigDataParams) =>
        fetchSection(data.ref, DEFAULT_SECTIONS_DETAILS, data.name, hasError)
      )
    )
  ).reduce(
    (curr: IProfileConfigData, prev: { name: any; data: any }) => ({
      ...curr,
      [prev.name]: prev.data,
    }),
    DEFAULT_PROFILE_CONFIG_DATA
  );

  const { header, experiences } = profileSections;

  const experienceData = (
    await Promise.all(
      (experiences.info as any[]).map((data: IExperienceJsonInfo) =>
        fetchSection(data.ref, DEFAULT_SECTIONS_DETAILS, data.name, hasError)
      )
    )
  ).map((data) => data.data);

  const sections = {
    ...profileSections,
    skills,
    experiences: {
      ...experiences,
      info: experienceData as unknown as IExperience[],
    },
    links,
  };

  profileData = {
    header,
    sections,
    download,
    forms: { contactForm },
    labels: profileLabels,
  };

  return { data: profileData, hasError };
};
