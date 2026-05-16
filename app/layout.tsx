import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import { browserName, isMobileOnly, osName } from "react-device-detect";
import PageWrapper from "./_components/common/PageWrapper";
import { DEFAULT_APP_CONTEXT, HEADER_INFO } from "./_constants/common";
import StyledComponentsRegistry from "./_lib/registry";
import mockProfileData from "./_mock/profile";
import { AppProviderClient } from "./_providers/app";
import { ProfileLayoutProviderClient } from "./_providers/profile/ProfileLayoutProvider";
import StoreProvider from "./_providers/store";
import { IPreloadedAsset } from "./_store/profile/types";
import {
  fetchBaseConfigLocal,
  fetchImagesLocal,
  fetchProfileDataLocal,
} from "./_utils/common/local-data";
import "./globals.scss";
import Loading from "./loading";

export const metadata: Metadata = HEADER_INFO.METADATA;

export const viewport: Viewport = HEADER_INFO.VIEWPORT;

const font = localFont({
  src: "../public/fonts/OpenSans.ttf",
  variable: "--font",
  display: "swap",
  preload: true,
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch data from local JSON files - fast and reliable
  let hasError = false,
    basicConfigData = DEFAULT_APP_CONTEXT.data,
    preloadSrcList: any[] = [],
    features = DEFAULT_APP_CONTEXT.data.features,
    profileData = mockProfileData,
    profileHasError = false,
    preloadedAssets: IPreloadedAsset[] = [];

  try {
    // Fetch data directly from local sources instead of making internal API calls
    const appConfig = await fetchBaseConfigLocal(DEFAULT_APP_CONTEXT.data);
    basicConfigData = appConfig.data || DEFAULT_APP_CONTEXT.data;
    preloadSrcList = appConfig.preloadSrcList || [];
    const jsonConfig = appConfig.jsonConfig;

    // Features are already in the app config
    features = basicConfigData.features || DEFAULT_APP_CONTEXT.data.features;

    // Fetch profile data directly
    try {
      const profileResult = await fetchProfileDataLocal(
        jsonConfig,
        mockProfileData
      );
      profileData = profileResult.data || mockProfileData;
    } catch (error) {
      console.error("Error loading profile data:", error);
      profileHasError = true;
    }

    // Fetch preloaded assets
    try {
      preloadedAssets = await fetchImagesLocal(preloadSrcList);
    } catch (error) {
      console.error("Error loading images:", error);
    }
  } catch (error) {
    hasError = true;
    console.error("Error loading layout data:", error);
  }

  return (
    <html lang="en" className={font.className}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
      </head>
      <body>
        <StoreProvider>
          <AppProviderClient
            value={{
              data: {
                ...basicConfigData,
                features,
                version:
                  process.env?.version || DEFAULT_APP_CONTEXT.data.version,
                isAdmin: false,
                links: basicConfigData.links,
                hasError,
                preloadSrcList,
                currentDevice: {
                  osName,
                  browserName,
                  isMobile: isMobileOnly,
                },
              },
            }}
          >
            <ProfileLayoutProviderClient
              value={{
                data: {
                  profileData,
                  preloadedAssets,
                  hasError: profileHasError,
                },
              }}
            >
              <StyledComponentsRegistry>
                <Suspense fallback={<Loading />}>
                  <PageWrapper>{children}</PageWrapper>
                </Suspense>
              </StyledComponentsRegistry>
            </ProfileLayoutProviderClient>
          </AppProviderClient>
        </StoreProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
