import { DEFAULT_APP_CONTEXT } from "@/_constants/common";
import { fetchBaseConfigLocal } from "@/_utils/common/local-data";
import { NextResponse } from "next/server";

// Cache for 1 hour
export const revalidate = 3600;

export async function GET() {
  try {
    const baseConfig = await fetchBaseConfigLocal(DEFAULT_APP_CONTEXT.data);
    
    return NextResponse.json(baseConfig, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('App config API error:', error);
    // Return defaults on error
    return NextResponse.json({
      data: DEFAULT_APP_CONTEXT.data,
      jsonConfig: {},
      preloadSrcList: [],
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  }
}
