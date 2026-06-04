import { NextResponse } from "next/server";
import prisma from "@/_lib/prisma";
import { corsHeaders, handleOptions } from "@/api/v1/_lib/cors";

export async function OPTIONS() {
  return handleOptions();
}

/**
 * GET /api/v1/config
 *
 * Returns the singleton app configuration row (feature flags, maintenance mode).
 * No authentication required — called by the mobile app before login.
 *
 * @returns JSON matching the AppConfig shape expected by the Flutter client.
 * @remarks GET · auth: none · cache: public 60s.
 */
export async function GET() {
  try {
    let config = await prisma.appConfig.findUnique({
      where: { id: "singleton" },
    });

    if (!config) {
      // Auto-create the singleton row if it doesn't exist yet.
      config = await prisma.appConfig.upsert({
        where: { id: "singleton" },
        create: {
          id: "singleton",
          minAppVersion: "1.0.0",
          enabledFeatures: ["finance", "chat"],
          maintenanceMode: false,
          maintenanceMessage: "",
        },
        update: {},
      });
    }

    return NextResponse.json(
      {
        minAppVersion: config.minAppVersion,
        enabledFeatures: config.enabledFeatures,
        maintenanceMode: config.maintenanceMode,
        maintenanceMessage: config.maintenanceMessage,
      },
      {
        headers: {
          ...corsHeaders(),
          "Cache-Control": "public, max-age=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[GET /api/v1/config] error:", error);
    // Fail open — return safe defaults so the app is never blocked by a DB error.
    return NextResponse.json(
      {
        minAppVersion: "1.0.0",
        enabledFeatures: ["finance", "chat"],
        maintenanceMode: false,
        maintenanceMessage: "",
      },
      {
        headers: corsHeaders(),
      },
    );
  }
}
