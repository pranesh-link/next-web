import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import { Suspense } from "react";
import { browserName, isMobileOnly, osName } from "react-device-detect";
import { DEFAULT_APP_CONTEXT, HEADER_INFO } from "./_constants/common";
import StyledComponentsRegistry from "./_lib/registry";
import { AppProviderClient } from "./_providers/app";
import { getApiUrl } from "./_utils/common";
import "./globals.scss";
import Loading from "./loading";

export const metadata: Metadata = HEADER_INFO.METADATA;

export const viewport: Viewport = HEADER_INFO.VIEWPORT;

const font = Work_Sans({
  weight: "400",
  subsets: ["latin"],
  variable: "--font",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO fix below in prod
  // const isMobile = headers().get("x-devicetype") === "mobile";

  const {
    data: basicConfigData = DEFAULT_APP_CONTEXT.data,
    hasError,
    preloadSrcList,
  } = await (await fetch(getApiUrl("app"))).json();

  return (
    <html lang="en" className={font.className}>
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
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </StyledComponentsRegistry>
        </AppProviderClient>
      </body>
    </html>
  );
}
