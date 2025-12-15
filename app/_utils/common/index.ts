import { IPageLink, IPageLinkCollection } from "@/_store/common/types";

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
  !!(item && typeof item === 'object' && "route" in item);

export const isInstanceOfPageLinkCollection = (
  item: any
): item is IPageLinkCollection => !!(item && typeof item === 'object' && "links" in item);

export const getApiUrl = (path: string) => {
  return `/api/${path}`;
};
