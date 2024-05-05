import mockProfileData from "@/_mock/profile";
import { ProfileLayoutProviderClient } from "@/_providers/profile/ProfileLayoutProvider";
import { IPreloadedAsset } from "@/_store/profile/types";
import { getApiData } from "@/api/utils";

export const dynamic = "force-dynamic";

export default async function Layout({
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
