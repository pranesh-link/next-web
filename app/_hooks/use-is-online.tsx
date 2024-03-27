"use client";
import { useEffect, useState } from "react";

export default function useIsOnline() {
  const initialVal = typeof window !== "undefined" ? navigator.onLine : false;
  const [online, setOnline] = useState(initialVal);
  useEffect(() => {
    window.addEventListener("online", () => setOnline(true));
    window.addEventListener("offline", () => setOnline(false));

    return () => {
      window.addEventListener("online", () => setOnline(true));
      window.addEventListener("offline", () => setOnline(false));
    };
  }, []);

  return online;
}
