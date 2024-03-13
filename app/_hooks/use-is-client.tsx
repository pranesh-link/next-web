"use client";
import { createContext, useState, useEffect, useContext } from "react";

const isClientCtx = createContext(false);

export const IsClientCtxProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  return (
    <isClientCtx.Provider value={isClient}>{children}</isClientCtx.Provider>
  );
};

export function useIsClient() {
  return useContext(isClientCtx);
}
