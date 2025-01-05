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
});

export const dynamic = "force-dynamic";
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO fix below in prod
  // const isMobile = headers().get("x-devicetype") === "mobile";
  let hasError = false,
    basicConfigData = DEFAULT_APP_CONTEXT.data,
    preloadSrcList: any[] = [],
    features = DEFAULT_APP_CONTEXT.data.features;

  await getApiData("app").then(
    (success) => {
      ({ data: basicConfigData = DEFAULT_APP_CONTEXT.data, preloadSrcList } =
        success);
    },
    () => {
      hasError = true;
    }
  );

  await getApiData("feature", { cache: "no-store" }).then(
    (success) => {
      features = success;
    },
    () => {
      hasError = true;
    }
  );

  return (
    <html lang="en" className={font.className}>
      <link rel="manifest" href="/manifest.json" />
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
            <StyledComponentsRegistry>
              <Suspense fallback={<Loading />}>
                <PWABanner />
                <GoToHome />
                <PageWrapper>{children}</PageWrapper>
                <Contact />
              </Suspense>
            </StyledComponentsRegistry>
          </AppProviderClient>
        </StoreProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
