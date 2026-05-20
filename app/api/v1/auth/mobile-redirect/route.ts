import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/_lib/auth";
import { signMobileToken } from "@/api/v1/_lib/auth";

/**
 * GET /api/v1/auth/mobile-redirect
 *
 * Bridge endpoint: NextAuth redirects here after successful Google sign-in.
 * Reads the session cookie, mints a mobile JWT, and deep-links back to the app.
 */
export async function GET(request: NextRequest) {
  const scheme =
    request.nextUrl.searchParams.get("scheme") || "luvverse";

  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse(
      html("Authentication failed", "No session found. Please try again."),
      { status: 401, headers: { "Content-Type": "text/html" } },
    );
  }

  const token = signMobileToken(session.user.id);
  const userData = encodeURIComponent(
    JSON.stringify({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    }),
  );

  const deepLink = `${scheme}://auth?token=${token}&user=${userData}`;

  return NextResponse.redirect(deepLink);
}

function html(title: string, message: string) {
  return `<!DOCTYPE html><html><head><title>${title}</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5}
.card{background:#fff;padding:2rem;border-radius:12px;text-align:center;max-width:400px;box-shadow:0 2px 8px rgba(0,0,0,.1)}</style>
</head><body><div class="card"><h2>${title}</h2><p>${message}</p></div></body></html>`;
}
