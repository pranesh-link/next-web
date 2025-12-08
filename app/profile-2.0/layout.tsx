import mockProfileData from "@/_mock/profile";
import { ProfileLayoutProviderClient } from "@/_providers/profile/ProfileLayoutProvider";
import { IPreloadedAsset } from "@/_store/profile/types";
import { getApiData } from "@/api/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile 2.0 - Next Generation Portfolio",
  description: "Modern, responsive profile page with rich UI and animations",
};

export const dynamic = "force-dynamic";

export default async function Profile2Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let profileData = mockProfileData,
    hasError = false,
    preloadedAssets: IPreloadedAsset[] = [];
  
  await getApiData("profile").then(
    (success) => {
      ({ profileData, preloadedAssets } = success);
    },
    () => {
      hasError = true;
    }
  );

  return (
    <ProfileLayoutProviderClient
      value={{ data: { profileData, preloadedAssets, hasError } }}
    >
      {children}
    </ProfileLayoutProviderClient>
  );
}
