import { DEFAULT_APP_CONTEXT } from "@/_constants/common";
import mockProfileData from "@/_mock/profile";
import { ProfileLayoutProviderClient } from "@/_providers/profile/ProfileLayoutProvider";
import { IPreloadedAsset } from "@/_store/profile/types";
import {
  fetchBaseConfigLocal,
  fetchImagesLocal,
  fetchProfileDataLocal,
} from "@/_utils/common/local-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile 3.0 - Dark Theme Portfolio",
  description: "Modern dark-themed profile page with scroll-reveal animations",
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let profileData = mockProfileData,
    hasError = false,
    preloadedAssets: IPreloadedAsset[] = [];

  try {
    const appConfig = await fetchBaseConfigLocal(DEFAULT_APP_CONTEXT.data);
    const { preloadSrcList, jsonConfig } = appConfig;

    const [assets, profileResult] = await Promise.all([
      fetchImagesLocal(preloadSrcList).catch(() => []),
      fetchProfileDataLocal(jsonConfig, mockProfileData).catch(() => ({
        data: mockProfileData,
      })),
    ]);

    preloadedAssets = assets;
    profileData = profileResult.data || mockProfileData;
  } catch {
    hasError = true;
  }

  return (
    <ProfileLayoutProviderClient
      value={{ data: { profileData, preloadedAssets, hasError } }}
    >
      {children}
    </ProfileLayoutProviderClient>
  );
}
