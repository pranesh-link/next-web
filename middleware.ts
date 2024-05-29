import { ROUTES } from "@/_constants/common";
import { getApiUrl } from "@/_utils/common";
import { NextRequest, NextResponse, userAgent } from "next/server";

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

export const dynamic = "force-dynamic";

export async function middleware(req: NextRequest) {
  const deviceType =
    userAgent(req).device.type === "mobile" ? "mobile" : "desktop";
  try {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", req.nextUrl.pathname);
    requestHeaders.set("x-devicetype", deviceType);
    const jsonResponse = await (
      await fetch(getApiUrl("maintenance"), { cache: "no-store" })
    ).json();
    const { searchParams, pathname } = req.nextUrl;

    const showMaintenancePage =
      searchParams.get("isAdmin") !== "true" &&
      jsonResponse.isUnderMaintenance &&
      pathname !== ROUTES.ROUTE_MAINTENANCE;

    if (showMaintenancePage) {
      req.nextUrl.pathname = ROUTES.ROUTE_MAINTENANCE;
      return NextResponse.redirect(req.nextUrl);
    }

    if (
      pathname === ROUTES.ROUTE_MAINTENANCE &&
      !jsonResponse.isUnderMaintenance
    ) {
      req.nextUrl.pathname = "/";
      return NextResponse.redirect(req.nextUrl, { headers: requestHeaders });
    }

    if (pathname.startsWith("/bmi")) {
      req.nextUrl.pathname = ROUTES.ROUTE_BMICALCULATOR;
      return NextResponse.redirect(req.nextUrl, {
        headers: requestHeaders,
        status: 308,
      });
    }

    if (pathname.includes("aishr")) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_CMS_SERVER}/files/Aishwarya_G_S_Resume.pdf`
      );
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (e) {
    console.error("error", e);
  }
}
