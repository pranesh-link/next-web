import { NextRequest, NextResponse } from "next/server";
import { db } from "@db";
import { users, authAccounts } from "@db/schema";
import { eq } from "drizzle-orm";
import { signMobileToken, signMobileRefreshToken } from "@/api/v1/_lib/auth";

/**
 * GET /api/auth/mobile-signin/callback
 *
 * Google OAuth callback. Exchanges the authorization code for tokens,
 * finds/creates the user, mints a JWT, and redirects back to the mobile
 * app via deep link: luvverse://auth?token=JWT&user=JSON.
 *
 * @remarks GET · No auth required (this IS the auth flow).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return redirectToApp(`error=${encodeURIComponent(error || "no_code")}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const baseUrl = process.env.NEXTAUTH_URL || "https://pranesh.link";
  const redirectUri = `${baseUrl}/api/auth/mobile-signin/callback`;

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("[mobile-signin] Token exchange failed:", err);
      return redirectToApp("error=token_exchange_failed");
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${tokens.access_token}` } },
    );

    if (!userRes.ok) {
      return redirectToApp("error=userinfo_failed");
    }

    const userInfo = await userRes.json();
    const { sub: googleId, email, name, picture } = userInfo;

    if (!email) {
      return redirectToApp("error=no_email");
    }

    // Find or create user
    let user = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({ email, name: name || null, image: picture || null })
        .returning();
      user = newUser;
      await db.insert(authAccounts).values({
        userId: user.id,
        type: "oauth",
        provider: "google",
        providerAccountId: googleId,
      });
    } else if (name || picture) {
      const [updated] = await db
        .update(users)
        .set({
          ...(name && { name }),
          ...(picture && { image: picture }),
        })
        .where(eq(users.id, user.id))
        .returning();
      user = updated;
    }

    // Sign JWT for mobile
    const token = signMobileToken(user.id);
    const refreshToken = signMobileRefreshToken(user.id);

    const userPayload = encodeURIComponent(
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }),
    );

    return redirectToApp(`token=${token}&refreshToken=${refreshToken}&user=${userPayload}`);
  } catch (err) {
    console.error("[mobile-signin] Callback error:", err);
    return redirectToApp("error=server_error");
  }
}

/** Redirect back to mobile app via deep link. */
function redirectToApp(params: string): NextResponse {
  return NextResponse.redirect(`luvverse://auth?${params}`);
}
