import { useEffect, useState } from "react";
import { useIsClient } from "./use-is-client";

export default function useIsOnline() {
  const initialVal = useIsClient() ? navigator.onLine : false;
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
