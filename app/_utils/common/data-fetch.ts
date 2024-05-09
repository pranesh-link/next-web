import {
  CONFIG_REF_INFO,
  CONFIG_TYPES,
  CORS_MODE,
  DEFAULT_PROFILE_CONFIG_DATA,
  DEFAULT_PROFILE_CONTEXT,
} from "@/_constants/profile";
import { IAppConfigData } from "@/_store/app/types";
import { IConfigData, IConfigDataParams } from "@/_store/common/types";
import {
  DownloadType,
  IExperience,
  IExperienceJsonInfo,
  IFormInfo,
  IHeader,
  IPreloadSrc,
  IProfileConfigData,
  IProfileData,
  ISectionInfo,
} from "@/_store/profile/types";
import { getImage } from ".";

async function getJsonResponse(jsonToFetch: string, data?: any) {
  const JSON_BASE_URL = process.env.NEXT_PUBLIC_CMS_SERVER;
  data = data || {};
  const url = `${JSON_BASE_URL}/${jsonToFetch}`;
  data = await (
    await fetch(url, {
      mode: CORS_MODE,
      cache: "no-store",
    })
  ).json();
  return data;
}

async function getProfileJsonResponse(
  jsonToFetch: string,
  data: IHeader | ISectionInfo | DownloadType | IFormInfo
) {
  return getJsonResponse(jsonToFetch, data);
}

export async function fetchSection(
  jsonToFetch: string,
  data: ISectionInfo | IHeader | DownloadType,
  name: string
) {
  const response = await getProfileJsonResponse(jsonToFetch, data);
  return {
    name,
    data: response as ISectionInfo,
  };
}

export async function fetchData(jsonToFetch: string, name: string) {
  const response = await getJsonResponse(jsonToFetch);
  return { name, data: response };
}

export const fetchBaseConfig = async (basicConfigData: IAppConfigData) => {
  let config: any = (
    (await fetchData(CONFIG_REF_INFO.ref, CONFIG_REF_INFO.name)) as unknown as {
      data: IConfigData;
    }
  ).data;

  const { jsonConfig, appConfig } = config;
  const configData = await Promise.all(
    (jsonConfig?.defaultConfig || []).map((data: IConfigDataParams) => {
      const { name, type, ref } = data;
      return type === CONFIG_TYPES.PROFILECONFIG
        ? fetchSection(ref, basicConfigData.links, name)
        : fetchData(ref, name);
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
  profileData: IProfileData
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
        fetchSection(data.ref, DEFAULT_SECTIONS_DETAILS, data.name)
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
        fetchSection(data.ref, DEFAULT_SECTIONS_DETAILS, data.name)
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

  return { data: profileData };
};
