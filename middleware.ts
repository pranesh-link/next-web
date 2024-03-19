import { ROUTES } from "@/_constants/common";
import { CORS_MODE } from "@/_constants/profile";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

export async function middleware(req: NextRequest) {
  try {
    const jsonResponse = await (
      await fetch(`${process.env.CMS_SERVER}/maintenance.json`, {
        mode: CORS_MODE,
      })
    ).json();
    const { searchParams, pathname } = req.nextUrl;

    const showMaintenancePage =
      searchParams.get("isAdmin") !== "true" &&
      jsonResponse.isUnderMaintenance &&
      pathname !== ROUTES.ROUTE_MAINTENANCE;

    if (showMaintenancePage) {
      req.nextUrl.pathname = ROUTES.ROUTE_MAINTENANCE;
      return NextResponse.rewrite(req.nextUrl);
    }

    if (pathname.startsWith("/bmi")) {
      req.nextUrl.pathname = ROUTES.ROUTE_BMICALCULATOR;
      return NextResponse.redirect(req.nextUrl, { status: 308 });
    }
  } catch (e) {
    console.error("error", e);
  }
}
