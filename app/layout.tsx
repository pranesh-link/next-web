import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import { Suspense } from "react";
import { browserName, isMobileOnly, osName } from "react-device-detect";
import GoToHome from "./_components/common/GoToHome";
import { DEFAULT_APP_CONTEXT, HEADER_INFO } from "./_constants/common";
import StyledComponentsRegistry from "./_lib/registry";
import { AppProviderClient } from "./_providers/app";
import { getApiData } from "./api/utils";
import "./globals.scss";
import Loading from "./loading";

export const metadata: Metadata = HEADER_INFO.METADATA;

export const viewport: Viewport = HEADER_INFO.VIEWPORT;

const font = Work_Sans({
  weight: "400",
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
  let hasError = false;
  let basicConfigData = DEFAULT_APP_CONTEXT.data,
    preloadSrcList: any[] = [];

  await getApiData("app").then(
    (success) => {
      ({ data: basicConfigData = DEFAULT_APP_CONTEXT.data, preloadSrcList } =
        success);
    },
    () => {
      hasError = true;
    }
  );

  return (
    <html lang="en" className={font.className}>
      <link rel="manifest" href="/manifest.json" />
      <body>
        <AppProviderClient
          value={{
            data: {
              ...basicConfigData,
              version: process.env?.version || DEFAULT_APP_CONTEXT.data.version,
              isAdmin: false,
              links: basicConfigData.links,
              hasError,
              preloadSrcList,
              currentDevice: { osName, browserName, isMobile: isMobileOnly },
            },
          }}
        >
          <StyledComponentsRegistry>
            <Suspense fallback={<Loading />}>
              <GoToHome />
              {children}
            </Suspense>
          </StyledComponentsRegistry>
        </AppProviderClient>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
