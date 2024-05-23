"use client";
import { useEffect, useState } from "react";

const useAppInstalled = () => {
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    window.addEventListener("appinstalled", (event) => {
      console.log("appinstalled", event);
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
