import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/_lib/prisma";
import { signMobileToken, signMobileRefreshToken } from "@/api/v1/_lib/auth";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-dev-secret";

/**
 * POST /api/v1/auth/refresh
 *
 * Accepts a refresh token and returns a new access + refresh token pair.
 * The old refresh token is invalidated by rotation (new one issued).
 *
 * @remarks POST · auth: refresh token (type=refresh JWT)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "refreshToken is required" },
        { status: 400 },
      );
    }

    // Verify the refresh token
    let decoded: { sub: string; type?: string };
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET) as {
        sub: string;
        type?: string;
      };
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }

    // Must be a refresh token type
    if (decoded.type !== "refresh") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 401 },
      );
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, name: true, email: true, image: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 },
      );
    }

    // Issue new token pair (rotation)
    const accessToken = signMobileToken(user.id);
    const newRefreshToken = signMobileRefreshToken(user.id);

    return NextResponse.json({
      token: accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("[auth/refresh] Error:", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 },
    );
  }
}
