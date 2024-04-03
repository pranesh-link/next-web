"use client";
import mockProfileData from "@/_mock/profile";
import React from "react";
import { IPreloadedAsset, IProfileData } from "../types";

const ProfileLayoutContext = React.createContext<{
  data: { profileData: IProfileData; preloadedAssets: IPreloadedAsset[] };
}>({
  data: { profileData: mockProfileData, preloadedAssets: [] },
});

const { Provider: ProfileLayoutProvider, Consumer: ProfileLayoutConsumer } =
  ProfileLayoutContext;

export { ProfileLayoutConsumer, ProfileLayoutContext, ProfileLayoutProvider };
