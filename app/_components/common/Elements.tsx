"use client";

export {
  ActionBtn,
  FlexBox,
  FlexBoxSection,
  Grid,
} from "./elements/Layout";
export type {
  ALIGN_ITEMS,
  FLEX_DIRECTION,
  FLEX_WRAP,
  JUSTIFY_CONTENT,
} from "./elements/Layout";
export {
  AutoCloseToastMessage,
  Desc,
  SecHeader,
  Version,
} from "./elements/Typography";
export {
  LoaderImg,
  ModalBanner,
  ModalContentWrap,
  MobilePWAWrapper,
  Overlay,
  PWAWrapper,
} from "./elements/Overlay";
export {
  PageContainer,
  ProjectInfoSectionWrapper,
  ProjectLink,
  ProjectName,
} from "./elements/Project";
export { SectionWrapper } from "./elements/SectionWrapper";
export { SectionsWrapper } from "./elements/SectionsWrapper";

import {
  ActionBtn,
  FlexBox,
  FlexBoxSection,
  Grid,
} from "./elements/Layout";
import {
  LoaderImg,
  ModalBanner,
  ModalContentWrap,
  MobilePWAWrapper,
  PWAWrapper,
} from "./elements/Overlay";
import {
  ProjectLink,
} from "./elements/Project";
import { SectionWrapper } from "./elements/SectionWrapper";
import { SectionsWrapper } from "./elements/SectionsWrapper";
import {
  AutoCloseToastMessage,
  Desc,
  SecHeader,
  Version,
} from "./elements/Typography";

/** Default export preserved for backwards compatibility with existing consumers. */
const exports = {
  ActionBtn,
  AutoCloseToastMessage,
  Desc,
  FlexBox,
  FlexBoxSection,
  Grid,
  LoaderImg,
  MobilePWAWrapper,
  ModalBanner,
  ModalContentWrap,
  PWAWrapper,
  ProjectLink,
  SecHeader,
  SectionWrapper,
  SectionsWrapper,
  Version,
};
export default exports;
