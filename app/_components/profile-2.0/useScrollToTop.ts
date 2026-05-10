"use client";
import { useEffect, useState } from "react";

/**
 * Hook that tracks whether the page has scrolled past a threshold
 * and exposes a smooth scroll-to-top action.
 */
export function useScrollToTop(threshold = 300) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return { showScrollTop, scrollToTop };
}
