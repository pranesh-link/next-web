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
    
    // Add performance and security headers
    const responseHeaders = new Headers();
    
    // Performance headers
    responseHeaders.set('X-DNS-Prefetch-Control', 'on');
    responseHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Referrer-Policy', 'origin-when-cross-origin');
    responseHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    const jsonResponse = await (
      await fetch(getApiUrl("maintenance"), { 
        cache: "no-store",
        next: { revalidate: 300 } // Cache for 5 minutes
      })
    ).json();
    const { searchParams, pathname } = req.nextUrl;

    const showMaintenancePage =
      searchParams.get("isAdmin") !== "true" &&
      jsonResponse.isUnderMaintenance &&
      pathname !== ROUTES.ROUTE_MAINTENANCE;

    if (showMaintenancePage) {
      req.nextUrl.pathname = ROUTES.ROUTE_MAINTENANCE;
      return NextResponse.redirect(req.nextUrl, { headers: responseHeaders });
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
      req.nextUrl.pathname = "/api/files/Aishwarya_G_S_Resume.pdf";
      return NextResponse.rewrite(req.nextUrl, { headers: responseHeaders });
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
      headers: responseHeaders,
    });
  } catch (e) {
    console.error("error", e);
    // Return without maintenance check if API fails
    return NextResponse.next();
  }
}
