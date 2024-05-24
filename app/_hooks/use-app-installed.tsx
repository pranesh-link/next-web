"use client";
import { getLocalStorage } from "@/_utils/profile/client";
import { useEffect, useState } from "react";

const useAppInstalled = () => {
  const [isAppInstalled, setIsAppInstalled] = useState(
    getLocalStorage("isAppInstalled") ?? false
  );

  useEffect(() => {
    window.addEventListener("appinstalled", (event) => {
      setIsAppInstalled(true);
    });

    return () => {
      window.removeEventListener("appinstalled", () => {
        setIsAppInstalled(false);
      });
    };
  }, []);
  return isAppInstalled;
};

export default useAppInstalled;
