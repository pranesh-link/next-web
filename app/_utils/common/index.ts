import {
  CONFIG_REF_INFO,
  CONFIG_TYPES,
  DEFAULT_PROFILE_CONFIG_DATA,
  DEFAULT_PROFILE_CONTEXT,
} from "@/_constants/profile";
import { IAppConfigData } from "@/_store/app/types";
import {
  IConfigData,
  IConfigDataParams,
  IPageLink,
  IPageLinkCollection,
} from "@/_store/common/types";
import {
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
