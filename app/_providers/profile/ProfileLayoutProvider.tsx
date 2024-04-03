"use client";

import { ProfileLayoutProvider } from "@/_store/profile/layout/context";
import { IPreloadedAsset, IProfileData } from "@/_store/profile/types";
import { ReactNode } from "react";

export function ProfileLayoutProviderClient({
  children,
  value,
}: {
  children: ReactNode;
  value: {
    data: { profileData: IProfileData; preloadedAssets: IPreloadedAsset[] };
  };
}) {
  return (
    <ProfileLayoutProvider value={value}>{children}</ProfileLayoutProvider>
  );
}
