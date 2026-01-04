"use client";
import { useEffect, useState } from "react";

export default function useIsOnline() {
  const initialVal = typeof window !== "undefined" ? navigator.onLine : false;
  const [online, setOnline] = useState(initialVal);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}
