import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import dynamicImport from "next/dynamic";
import { IBM_Plex_Sans } from "next/font/google";
import { Suspense } from "react";
import { browserName, isMobileOnly, osName } from "react-device-detect";
import GoToHome from "./_components/common/GoToHome";
import PageWrapper from "./_components/common/PageWrapper";
import Contact from "./_components/profile/sections/Contact";
import { DEFAULT_APP_CONTEXT, HEADER_INFO } from "./_constants/common";
import StyledComponentsRegistry from "./_lib/registry";
import { AppProviderClient } from "./_providers/app";
import StoreProvider from "./_providers/store";
import { ProfileLayoutProviderClient } from "./_providers/profile/ProfileLayoutProvider";
import { IPreloadedAsset } from "./_store/profile/types";
import mockProfileData from "./_mock/profile";
import { getApiData } from "./api/utils";
import "./globals.scss";
import Loading from "./loading";

const PWABanner = dynamicImport(() => import("@/_components/common/PWABanner"));

export const metadata: Metadata = HEADER_INFO.METADATA;

export const viewport: Viewport = HEADER_INFO.VIEWPORT;

const font = IBM_Plex_Sans({
  weight: "500",
  subsets: ["latin"],
  variable: "--font",
  display: "swap",
  preload: true,
});

export const dynamic = "force-dynamic";
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
    const [appData, featureData, profileDataResult] = await Promise.allSettled([
      getApiData("app", { next: { revalidate: 3600 } }),
      getApiData("feature", { next: { revalidate: 3600 } }),
      getApiData("profile", { next: { revalidate: 3600 } }),
    ]);

    if (appData.status === "fulfilled") {
      ({ data: basicConfigData = DEFAULT_APP_CONTEXT.data, preloadSrcList } =
        appData.value);
    } else {
      hasError = true;
    }

    if (featureData.status === "fulfilled") {
      features = featureData.value;
    } else {
      hasError = true;
    }

    if (profileDataResult.status === "fulfilled") {
      ({ profileData, preloadedAssets } = profileDataResult.value);
    } else {
      profileHasError = true;
    }
  } catch (error) {
    hasError = true;
    console.error("Error loading layout data:", error);
  }

  return (
    <html lang="en" className={font.className}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
              value={{ data: { profileData, preloadedAssets, hasError: profileHasError } }}
            >
              <StyledComponentsRegistry>
                <Suspense fallback={<Loading />}>
                  <PWABanner />
                  <GoToHome />
                  <PageWrapper>{children}</PageWrapper>
                  <Contact />
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
