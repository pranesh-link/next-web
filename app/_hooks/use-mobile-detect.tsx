"use client";
import { useEffect, useState } from "react";

const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const setViewportProps = () => setIsMobile(window.innerWidth < 768);
  useEffect(() => {
    window.addEventListener("resize", setViewportProps);
    return () => window.removeEventListener("resize", setViewportProps);
  }, []);
  return isMobile;
};

export default useMobileDetect;
