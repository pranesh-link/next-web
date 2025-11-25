import mockProfileData from "@/_mock/profile";
import { fetchImagesLocal, fetchProfileDataLocal } from "@/_utils/common/local-data";
import { NextResponse } from "next/server";
import { getApiData } from "../utils";

// Cache for 1 hour
export const revalidate = 3600;

export async function GET() {
  try {
    const config = await getApiData("app");
    const { preloadSrcList, jsonConfig } = config;
    
    const [preloadedAssets, profileDataResult] = await Promise.all([
      fetchImagesLocal(preloadSrcList).catch(() => ({})),
      fetchProfileDataLocal(jsonConfig, mockProfileData).catch(() => ({ data: mockProfileData })),
    ]);

    return NextResponse.json(
      {
        profileData: profileDataResult.data,
        preloadedAssets,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json(
      {
        profileData: mockProfileData,
        preloadedAssets: {},
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  }
}
