"use client";
import { useEffect, useState } from "react";

const useIsBrowser = () => {
  const [isBrowser, setIsBrowser] = useState(
    typeof window !== "undefined"
      ? window.matchMedia("(display-mode: browser)").matches
      : false
  );

  useEffect(() => {
    window
      .matchMedia("(display-mode: browser)")
      .addEventListener("change", ({ matches }) => {
        setIsBrowser(matches);
      });

    return () => {
      window
        .matchMedia("(display-mode: browser)")
        .removeEventListener("change", ({ matches }) => {
          setIsBrowser(matches);
        });
    };
  }, []);
  return isBrowser;
};

export default useIsBrowser;
