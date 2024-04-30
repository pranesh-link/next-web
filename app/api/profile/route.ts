import { DEFAULT_APP_CONTEXT } from "@/_constants/common";
import mockProfileData from "@/_mock/profile";
import {
  fetchBaseConfig,
  fetchImages,
  fetchProfileData,
} from "@/_utils/common/data-fetch";
import { NextResponse } from "next/server";

export async function GET() {
  const baseConfig = await fetchBaseConfig(DEFAULT_APP_CONTEXT.data, false);
  const { preloadSrcList, hasError, jsonConfig } = baseConfig;
  const preloadedAssets = await fetchImages(preloadSrcList);
  const { data: profileData } = await fetchProfileData(
    jsonConfig,
    mockProfileData,
    hasError
  );

  return NextResponse.json({
    profileData,
    hasError,
    preloadedAssets,
  });
}
