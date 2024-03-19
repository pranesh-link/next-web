import type { Metadata, Viewport } from "next";
import "./globals.css";
import {
  DEFAULT_APP_CONTEXT,
  DEFAULT_CONFIG_DATA,
  HEADER_INFO,
} from "./_constants/common";
import { IConfigData } from "./_store/common/types";
import { osName, browserName, isMobileOnly } from "react-device-detect";
import {
  fetchBaseConfig,
  fetchImages,
  fetchProfileData,
} from "./_utils/common/data-fetch";
import { IPreloadSrc } from "@/_store/profile/types";
import { AppProviderClient } from "./_providers/app";
import mockProfileData from "./_mock/profile";
import { Suspense } from "react";
import Loading from "./loading";
import StyledComponentsRegistry from "./_lib/registry";

export const metadata: Metadata = HEADER_INFO.METADATA;

export const viewport: Viewport = HEADER_INFO.VIEWPORT;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let basicConfigData = DEFAULT_APP_CONTEXT.data;
  let hasError = false;
  let jsonConfig: IConfigData["jsonConfig"] = DEFAULT_CONFIG_DATA.jsonConfig;
  let preloadAssetImages: { id: any; image: any }[] = [],
    preloadSrcList: IPreloadSrc[] = [],
    profileData = mockProfileData;
  // Base config fetch
  ({
    data: basicConfigData,
    hasError,
    jsonConfig,
    preloadSrcList,
  } = await fetchBaseConfig(basicConfigData, hasError));
  // Image preloading and profile data fetch
  [preloadAssetImages, { data: profileData, hasError }] = await Promise.all([
    fetchImages(preloadSrcList),
    fetchProfileData(jsonConfig, profileData, hasError),
  ]);

  return (
    <html lang="en">
      <body>
        <AppProviderClient
          value={{
            data: {
              ...basicConfigData,
              version: process.env?.version || DEFAULT_APP_CONTEXT.data.version,
              isAdmin: false,
              links: basicConfigData.links,
              preloadedAssets: preloadAssetImages,
              hasError,
              profileData,
              preloadSrcList,
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
