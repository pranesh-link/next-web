"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActiveDot,
  FABButton,
  ProgressFill,
  ProgressTrack,
  SheetHandle,
  SheetIcon,
  SheetItem,
  SheetItems,
  SheetOverlay,
  SheetPanel,
  SheetTitle,
} from "./InterestNav.styled";

const sectionMap = [
  { id: "hero", icon: "🏠", label: "Home" },
  { id: "skills", icon: "🛠", label: "What I Know" },
  { id: "experience", icon: "🏢", label: "My Journey" },
  { id: "education", icon: "🎓", label: "Education" },
  { id: "open-source", icon: "📦", label: "Projects" },
];

/**
 * Floating action button + bottom-sheet/popover that lets users jump
 * between top-level sections of profile-3.0, plus a thin scroll
 * progress indicator on the right edge.
 *
 * @returns The interest-nav UI fragment.
 */
const InterestNav: React.FC = () => {
  const [showFab, setShowFab] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;

    setShowFab(scrollY > 400);
    setScrollProgress(Math.min(progress, 100));

    let current = "hero";
    for (let i = sectionMap.length - 1; i >= 0; i--) {
      const el = document.getElementById(sectionMap[i].id);
      if (el) {
        const top = el.getBoundingClientRect().top + scrollY;
        if (scrollY + 150 >= top) {
          current = sectionMap[i].id;
          break;
        }
      }
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const handleNav = (sectionId: string) => {
    setSheetOpen(false);
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }, 100);
  };

  const currentIcon =
    sectionMap.find((s) => s.id === activeSection)?.icon || "◎";

  return (
    <>
      <ProgressTrack>
        <ProgressFill $progress={scrollProgress} />
      </ProgressTrack>

      <FABButton
        $visible={showFab}
        onClick={() => setSheetOpen(true)}
        aria-label="Navigate sections"
      >
        {currentIcon}
      </FABButton>

      <SheetOverlay $open={sheetOpen} onClick={() => setSheetOpen(false)} />
      <SheetPanel $open={sheetOpen}>
        <SheetHandle />
        <SheetTitle>Explore</SheetTitle>
        <SheetItems>
          {sectionMap.map((item, index) => (
            <SheetItem
              key={item.id}
              $active={activeSection === item.id}
              $index={index}
              onClick={() => handleNav(item.id)}
            >
              <SheetIcon>{item.icon}</SheetIcon>
              {item.label}
              {activeSection === item.id && <ActiveDot />}
            </SheetItem>
          ))}
        </SheetItems>
      </SheetPanel>
    </>
  );
};

export default InterestNav;
