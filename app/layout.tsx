import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  CMS_SERVER_CONFIG,
  DEFAULT_APP_CONTEXT,
  ENVIRONMENT,
  PAGE_TITLES,
  SITE_INFO,
} from "./_constants/common";
import { IConfigData, IConfigDataParams } from "./_store/common/types";
import { osName, browserName, isMobileOnly } from "react-device-detect";
import { getImage } from "./_utils/common";
import {
  CONFIG_REF_INFO,
  CONFIG_TYPES,
  DEFAULT_PROFILE_CONFIG_DATA,
  DEFAULT_PROFILE_CONTEXT,
} from "@/_constants/profile";
import {
  DownloadType,
  IExperienceJsonInfo,
  IHeader,
  IPreloadSrc,
  IProfileConfigData,
  ISectionInfo,
} from "@/_store/profile/types";
import {
  getJsonResponse,
  getProfileJsonResponse,
} from "@/_utils/profile/server";
import { AppProviderClient } from "./_providers/app";
import mockProfileData from "./_mock/profile";
import { Suspense } from "react";
import Loading from "./loading";
import StyledComponentsRegistry from "./_lib/registry";

export const metadata: Metadata = {
  title: PAGE_TITLES.profile,
  description: SITE_INFO.DESCRIPTION,
  keywords: SITE_INFO.KEYWORDS,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Base config fetch
  let basicConfigData = DEFAULT_APP_CONTEXT.data;
  let hasError = false;
  let preloadAssetImages: { id: any; image: any }[] = [],
    preloadSrcList: IPreloadSrc[] = [],
    profileData = mockProfileData;
  let config: any = (
    (await fetchData(CONFIG_REF_INFO.ref, CONFIG_REF_INFO.name)) as unknown as {
      data: IConfigData;
    }
  ).data;
  const { jsonConfig, appConfig } = config;
  preloadSrcList = appConfig?.preLoadSrcList;
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
  // Image and files preloading
  let isCancelled = false;
  if (isCancelled) {
    return;
  }
  for (const item of appConfig?.preloadSrcList || []) {
    if (item.type === "image") {
      const image = await getImage(item.fileName, item.id);
      preloadAssetImages.push(image);
    }
  }
  if (isCancelled) {
    return;
  }
  // Profile info fetch
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
    experiences: { ...experiences, info: experienceData },
    links,
  };

  profileData = {
    header,
    sections,
    download,
    forms: { contactForm },
    labels: profileLabels,
  };

  async function fetchSection(
    jsonToFetch: string,
    data: ISectionInfo | IHeader | DownloadType,
    name: string
  ) {
    const response = await getProfileJsonResponse(
      ENVIRONMENT,
      jsonToFetch,
      CMS_SERVER_CONFIG,
      data
    );

    hasError = response.hasError;
    return { name, data: response.data as ISectionInfo };
  }

  async function fetchData(jsonToFetch: string, name: string) {
    const response = await getJsonResponse(
      ENVIRONMENT,
      jsonToFetch,
      CMS_SERVER_CONFIG
    );
    hasError = response.hasError;
    return { name, data: response.data };
  }

  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body>
        <AppProviderClient
          value={{
            data: {
              ...basicConfigData,
              version: process.env?.version || DEFAULT_APP_CONTEXT.data.version,
              isAdmin: false,
              links,
              preloadedAssets: preloadAssetImages,
              hasError,
              profileData,
              preloadSrcList: appConfig?.preloadSrcList || [],
              currentDevice: { osName, browserName, isMobile: isMobileOnly },
            },
          }}
        >
          <StyledComponentsRegistry>
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </StyledComponentsRegistry>
        </AppProviderClient>
      </body>
    </html>
  );
}
