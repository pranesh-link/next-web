import { REVALIDATE_CONFIG } from "@/_constants/common";
import mockProfileData from "@/_mock/profile";
import { ProfileLayoutProviderClient } from "@/_providers/profile/ProfileLayoutProvider";
import { getApiUrl } from "@/_utils/common";

export const dynamic = "force-dynamic";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profileData = mockProfileData, preloadedAssets } = await (
    await fetch(getApiUrl("profile"), { next: REVALIDATE_CONFIG })
  ).json();

  return (
    <ProfileLayoutProviderClient
      value={{ data: { profileData, preloadedAssets } }}
    >
      {children}
    </ProfileLayoutProviderClient>
  );
}
