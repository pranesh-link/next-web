"use client";
import React from "react";
import { IProfileContext } from "./types";
import { DEFAULT_PROFILE_CONTEXT } from "@/_constants/profile";

const ProfileContext = React.createContext<IProfileContext>(
  DEFAULT_PROFILE_CONTEXT
);

const { Provider: ProfileProvider, Consumer: ProfileConsumer } = ProfileContext;

export { ProfileProvider, ProfileConsumer, ProfileContext };
