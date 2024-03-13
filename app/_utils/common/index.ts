import { IPageLink, IPageLinkCollection } from "@/_store/common/types";
import {
  Environment,
  ICMSServerConfig,
  IHeader,
  ISectionInfo,
  DownloadType,
  IFormInfo,
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
