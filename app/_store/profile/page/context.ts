"use client";
import { DEFAULT_PROFILE_CONTEXT } from "@/_constants/profile";
import React from "react";
import { IProfileContext } from "../types";

const ProfileContext = React.createContext<IProfileContext>(
  DEFAULT_PROFILE_CONTEXT
);

const { Provider: ProfileProvider, Consumer: ProfileConsumer } = ProfileContext;

export { ProfileConsumer, ProfileContext, ProfileProvider };
