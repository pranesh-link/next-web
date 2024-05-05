import mockProfileData from "@/_mock/profile";
import { fetchImages, fetchProfileData } from "@/_utils/common/data-fetch";
import { NextResponse } from "next/server";
import { getApiData } from "../utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getApiData("app");
  const { preloadSrcList, jsonConfig } = config;
  const preloadedAssets = await fetchImages(preloadSrcList);
  const { data: profileData } = await fetchProfileData(
    jsonConfig,
    mockProfileData
  );

  return NextResponse.json({
    profileData,
    preloadedAssets,
  });
}
