import { NextRequest, NextResponse, userAgent } from "next/server";

export const config = {
  matcher: [
    {
      source:
        "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Max-Age": "86400",
};

export const dynamic = "force-dynamic";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Handle CORS preflight for API routes at the edge (prevents redirect issues)
  if (pathname.startsWith("/api/") && req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  // Add CORS headers to all API responses
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  const deviceType =
    userAgent(req).device.type === "mobile" ? "mobile" : "desktop";
  try {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-pathname", pathname);
    requestHeaders.set("x-devicetype", deviceType);
    
    // Add performance and security headers
    const responseHeaders = new Headers();
    
    // Performance headers
    responseHeaders.set('X-DNS-Prefetch-Control', 'on');
    responseHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Referrer-Policy', 'origin-when-cross-origin');
    responseHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    responseHeaders.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    responseHeaders.set('X-Permitted-Cross-Domain-Policies', 'none');
    responseHeaders.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com; frame-ancestors 'none';"
    );
    
    const { pathname } = req.nextUrl;

    // Allow static assets and Server Actions through
    if (
      pathname.startsWith("/fonts") ||
      pathname.endsWith(".js") ||
      pathname.endsWith(".json") ||
      req.headers.get("next-action") // Server Actions
    ) {
      return NextResponse.next({
        request: { headers: requestHeaders },
        headers: responseHeaders,
      });
    }

    // Backward compatibility: redirect old /finance routes to /couple/finance
    if (pathname.startsWith("/finance")) {
      const newPath = pathname.replace(/^\/finance/, "/couple/finance");
      req.nextUrl.pathname = newPath;
      return NextResponse.redirect(req.nextUrl, { status: 308, headers: responseHeaders });
    }

    // Redirect all routes to homepage except root, admin, and couple
    if (pathname !== "/" && !pathname.startsWith("/api") && !pathname.startsWith("/admin") && !pathname.startsWith("/couple")) {
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
