import { NextRequest, NextResponse } from "next/server";
import prisma from "@/_lib/prisma";
import { signMobileToken } from "@/api/v1/_lib/auth";

/**
 * POST /api/v1/auth/mobile
 *
 * Accepts a Google ID token from native Google Sign-In,
 * verifies it with Google's tokeninfo endpoint,
 * finds/creates the user, and returns a JWT + user object.
 *
 * @remarks POST · auth: Google ID token verification
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid idToken" },
        { status: 400 },
      );
    }

    // Verify the ID token with Google
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
    const { sub: googleId, email, name, picture, aud } = payload;

    // Verify the token was issued for our app
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && aud !== expectedClientId) {
      return NextResponse.json(
        { error: "Token audience mismatch" },
        { status: 401 },
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "No email in Google token" },
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

    // Sign our own JWT for subsequent API calls
    const token = signMobileToken(user.id);

    return NextResponse.json({
      token,
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
