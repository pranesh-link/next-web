import mockProfileData from "@/_mock/profile";
import { ProfileLayoutProviderClient } from "@/_providers/profile/ProfileLayoutProvider";
import { getApiUrl } from "@/_utils/common";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profileData = mockProfileData, preloadedAssets } = await (
    await fetch(getApiUrl("profile"))
  ).json();

  return (
    <ProfileLayoutProviderClient
      value={{ data: { profileData, preloadedAssets } }}
    >
      {children}
    </ProfileLayoutProviderClient>
  );
}
