import { NextRequest, NextResponse } from "next/server";
import prisma from "@/_lib/prisma";
import { signMobileToken, signMobileRefreshToken } from "@/api/v1/_lib/auth";

/**
 * POST /api/v1/auth/mobile
 *
 * Supports two auth modes:
 * 1. Native: accepts { idToken } from @react-native-google-signin
 * 2. Web: accepts { code, redirectUri } from expo-auth-session
 *
 * Verifies with Google, finds/creates user, returns JWT + user object.
 *
 * @remarks POST · auth: Google token/code verification
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, code, redirectUri } = body;

    let googleId: string;
    let email: string;
    let name: string | undefined;
    let picture: string | undefined;

    if (idToken) {
      // Native mode: verify ID token directly
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      );

      if (!verifyRes.ok) {
        return NextResponse.json(
          { error: "Invalid Google ID token" },
          { status: 401 },
        );
      }

      const payload = await verifyRes.json();
      const expectedClientId = process.env.GOOGLE_CLIENT_ID;
      if (expectedClientId && payload.aud !== expectedClientId) {
        return NextResponse.json(
          { error: "Token audience mismatch" },
          { status: 401 },
        );
      }

      googleId = payload.sub;
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else if (code && redirectUri) {
      // Web mode: exchange auth code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error("[mobile-auth] Token exchange failed:", err);
        return NextResponse.json(
          { error: "Token exchange failed" },
          { status: 401 },
        );
      }

      const tokens = await tokenRes.json();

      // Fetch user info with access token
      const userRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      );

      if (!userRes.ok) {
        return NextResponse.json(
          { error: "Failed to get user info" },
          { status: 401 },
        );
      }

      const userInfo = await userRes.json();
      googleId = userInfo.sub;
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else {
      return NextResponse.json(
        { error: "Provide either idToken (native) or code+redirectUri (web)" },
        { status: 400 },
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "No email from Google" },
        { status: 400 },
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: { email, name: name || null, image: picture || null },
      });
      await prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: googleId,
        },
      });
    } else if (name || picture) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name && { name }),
          ...(picture && { image: picture }),
        },
      });
    }

    const token = signMobileToken(user.id);
    const refreshToken = signMobileRefreshToken(user.id);

    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("[mobile-auth] Error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
