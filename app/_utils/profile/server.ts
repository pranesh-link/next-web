import { CORS_MODE } from "@/_constants/profile";
import { ILink, IPreloadedAsset } from "@/_store/profile/types";

export const lowercase = (str: string) => str.toLowerCase().replace(/ /g, "");

export const uppercase = (str: string) => str.toUpperCase().replace(/ /g, "");

export const replaceWith = (
  mainStr: string,
  replaceChar1: string,
  replaceChar2: string
) => mainStr.replace(replaceChar1, replaceChar2);

export const getHref = (label: string, info: string) => {
  switch (label) {
    case "mobile":
      return `tel:${info}`;
    case "e-mail":
      return `mailto:${info}`;
  }
  return "";
};

export const getPdfFile = async (url: string) => {
  let blob = {};
  if (url) {
    const response = await fetch(url, {
      mode: CORS_MODE,
      cache: "no-store",
    });
    blob = await response.blob();
  }
  return blob;
};

export const getPdfBlob = async (url: string) => getPdfFile(url);

export const getPdfObjectUrl = async (fileName: string = "") => {
  const blob = await getPdfBlob(getPdfUrl(fileName));
  return URL.createObjectURL(blob as Blob);
};

export const isEmptyObject = (obj: Object) => Object.keys(obj).length === 0;

export const isObject = (val: any): val is Object => typeof val === "object";

export const isString = (val: any): val is string => typeof val === "string";

export const getObjectKeyValuesByIndex = (obj: Object, index: number) => [
  Object.keys(obj)[index],
  Object.values(obj)[index],
];

export const getFilteredLinks = (info: ILink[]) =>
  info.filter((link) => link?.display !== false);

export const isSupportedBrowserAndOS = (
  browsers: string[],
  os: string[],
  browserName: string,
  osName: string
) => {
  const isSupportedBrowser = browsers.indexOf(browserName) > -1;
  const isSupportedOS = os.indexOf(osName) > -1;
  return isSupportedOS && isSupportedBrowser;
};

export const toDataURL = async (url: string, imageId: string) => {
  const response = await fetch(`.${url}`);
  const blobResponse = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve({ id: imageId, image: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(blobResponse);
  });
};

export const getIconUrl = (url: string) =>
  `${process.env.NEXT_PUBLIC_SITE_URL}/api/images/${url}`;

export const getPdfUrl = (fileName: string) => {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/api/files/${fileName}`;
};

export const getPreloadedAsset = (assets: IPreloadedAsset[], assetId: string) =>
  assets.find((item) => item.id === assetId)?.image || "";

export const goToLink = (link: string = "", target: string = "_blank") =>
  window.open(link, target);
