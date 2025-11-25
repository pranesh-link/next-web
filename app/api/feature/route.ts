import { NextResponse } from "next/server";
import { DEFAULT_APP_CONTEXT } from "@/_constants/common";

// Cache for 1 hour
export const revalidate = 3600;

export async function GET() {
  try {
    // Return default features from constants - no DB needed
    const features = DEFAULT_APP_CONTEXT.data.features;

    return NextResponse.json(features, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Feature API error:', error);
    return NextResponse.json(DEFAULT_APP_CONTEXT.data.features, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  }
}
