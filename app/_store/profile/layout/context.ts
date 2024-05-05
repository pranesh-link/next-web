"use client";
import mockProfileData from "@/_mock/profile";
import React from "react";
import { IPreloadedAsset, IProfileData } from "../types";

const ProfileLayoutContext = React.createContext<{
  data: {
    profileData: IProfileData;
    preloadedAssets: IPreloadedAsset[];
    hasError: boolean;
  };
}>({
  data: { profileData: mockProfileData, preloadedAssets: [], hasError: false },
});

const { Provider: ProfileLayoutProvider, Consumer: ProfileLayoutConsumer } =
  ProfileLayoutContext;

export { ProfileLayoutConsumer, ProfileLayoutContext, ProfileLayoutProvider };
