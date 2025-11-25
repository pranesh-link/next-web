import { promises as fs } from 'fs';
import path from 'path';
import {
  CONFIG_TYPES,
  DEFAULT_PROFILE_CONFIG_DATA,
  DEFAULT_PROFILE_CONTEXT,
} from '@/_constants/profile';
import { IAppConfigData } from '@/_store/app/types';
import { IConfigData, IConfigDataParams } from '@/_store/common/types';
import {
  DownloadType,
  IExperience,
  IHeader,
  IPreloadSrc,
  IProfileConfigData,
  IProfileData,
  ISectionInfo,
} from '@/_store/profile/types';
import { getImage } from '.';

const DATA_DIR = path.join(process.cwd(), 'data', 'cms');

async function getLocalJson(filename: string) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    throw error;
  }
}

async function fetchSection(
  filename: string,
  data: ISectionInfo | IHeader | DownloadType,
  name: string
) {
  const response = await getLocalJson(filename);
  return {
    name,
    data: response as ISectionInfo,
  };
}

async function fetchData(filename: string, name: string) {
  const response = await getLocalJson(filename);
  return { name, data: response };
}

export const fetchBaseConfigLocal = async (basicConfigData: IAppConfigData) => {
  const config: any = (
    (await fetchData('config.json', 'config')) as unknown as {
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

export const fetchImagesLocal = async (preloadSrcList: IPreloadSrc[]) => {
  const preloadedAssetImages = [];

  for (const item of preloadSrcList || []) {
    if (item.type === 'image') {
      const image = await getImage(item.fileName, item.id);
      preloadedAssetImages.push(image);
    }
  }
  return preloadedAssetImages;
};

export const fetchProfileDataLocal = async (
  jsonConfig: IConfigData['jsonConfig'],
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
      (experiences.info as any[]).map((data: { ref: string; name: string }) =>
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
