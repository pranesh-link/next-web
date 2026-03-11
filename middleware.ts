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
    
    const { pathname } = req.nextUrl;

    // Redirect all routes to homepage except root and admin
    if (pathname !== "/" && !pathname.startsWith("/api") && !pathname.startsWith("/admin")) {
      req.nextUrl.pathname = "/";
      return NextResponse.redirect(req.nextUrl, { headers: responseHeaders });
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
