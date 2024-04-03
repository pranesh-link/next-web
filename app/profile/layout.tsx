import { DEFAULT_APP_CONTEXT } from "@/_constants/common";
import mockProfileData from "@/_mock/profile";
import { ProfileLayoutProviderClient } from "@/_providers/profile/ProfileLayoutProvider";
import {
  fetchBaseConfig,
  fetchImages,
  fetchProfileData,
} from "@/_utils/common/data-fetch";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let profileData = mockProfileData,
    preloadedAssets = [];
  let { hasError, jsonConfig, preloadSrcList } = await fetchBaseConfig(
    DEFAULT_APP_CONTEXT.data,
    false
  );
  [preloadedAssets, { data: profileData, hasError }] = await Promise.all([
    fetchImages(preloadSrcList),
    fetchProfileData(jsonConfig, profileData, hasError),
  ]);
  return (
    <ProfileLayoutProviderClient
      value={{ data: { profileData, preloadedAssets } }}
    >
      {children}
    </ProfileLayoutProviderClient>
  );
}
