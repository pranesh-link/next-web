import mockProfileData from "@/_mock/profile";
import { ProfileLayoutProviderClient } from "@/_providers/profile/ProfileLayoutProvider";
import { getApiData } from "@/api/utils";

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profileData = mockProfileData, preloadedAssets } = await getApiData(
    "profile"
  );

  return (
    <ProfileLayoutProviderClient
      value={{ data: { profileData, preloadedAssets } }}
    >
      {children}
    </ProfileLayoutProviderClient>
  );
}
