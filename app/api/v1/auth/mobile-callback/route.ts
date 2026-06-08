import { NextRequest, NextResponse } from "next/server";
import { signMobileToken, findOrCreateGoogleUser } from "@/api/v1/_lib/auth";

/**
 * GET /api/v1/auth/mobile-callback?code=XXX&state=BASE64
 *
 * Google redirects here after the user consents.
 * Exchanges the auth code for tokens, finds/creates the user,
 * signs a JWT, and returns an HTML page that deep-links back
 * to Expo Go with the credentials.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return htmlResponse(`<h2>Sign-in cancelled</h2><p>${error}</p>`);
  }

  if (!code || !stateParam) {
    return htmlResponse("<h2>Missing authorization code</h2>");
  }

  // Decode return_url from state
  let returnUrl: string;
  let callbackUrl: string;
  try {
    const state = JSON.parse(
      Buffer.from(stateParam, "base64url").toString(),
    );
    returnUrl = state.returnUrl;
    callbackUrl = state.callbackUrl;
    if (!returnUrl || !returnUrl.startsWith("exp://")) {
      return htmlResponse("<h2>Invalid return URL</h2>");
    }
  } catch {
    return htmlResponse("<h2>Invalid state parameter</h2>");
  }

  if (!callbackUrl) {
    return htmlResponse("<h2>Invalid state: missing callback URL</h2>");
  }

  // Exchange code for Google tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("[mobile-callback] Token exchange failed:", err);
    return htmlResponse("<h2>Token exchange failed</h2><p>Please try again.</p>");
  }

  const tokens = await tokenRes.json();

  // Fetch Google user info
  const userRes = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${tokens.access_token}` } },
  );

  if (!userRes.ok) {
    return htmlResponse("<h2>Failed to get user info</h2>");
  }

  const googleUser = await userRes.json();
  const { sub: googleId, email, name, picture } = googleUser;

  if (!email) {
    return htmlResponse("<h2>No email associated with this Google account</h2>");
  }

  // Find or create user (same logic as POST /auth/google)
  const user = await findOrCreateGoogleUser({ googleId, email, name, picture });

  const jwt = signMobileToken(user.id);

  const userPayload = encodeURIComponent(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    }),
  );

  // Build the deep link back to Expo Go
  const deepLink = `${returnUrl}?token=${encodeURIComponent(jwt)}&user=${userPayload}`;

  // Return HTML that auto-redirects to the deep link
  return htmlResponse(`
    <h2>Signed in successfully!</h2>
    <p>Returning to LuvVerse...</p>
    <script>window.location.replace(${JSON.stringify(deepLink)});</script>
    <noscript><a href="${deepLink}">Tap here to return to the app</a></noscript>
  `);
}

function htmlResponse(body: string): NextResponse {
  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>LuvVerse</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex;
           justify-content: center; align-items: center; min-height: 80vh;
           text-align: center; color: #333; }
  </style>
</head><body>${body}</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
