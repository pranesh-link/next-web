"use client";
import React, { useEffect, useState } from "react";
import {
  NavContainer,
  NavContent,
  NavLinks,
  NavLink,
} from "./NavigationElements";

/**
 * Navigation Component
 * Desktop navigation menu with smooth scrolling to sections
 * Features: Sticky positioning, active section highlighting, smooth scroll
 */

interface NavigationProps {
  onMenuClick?: () => void;
}

const navigationItems = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "open-source", label: "Projects" },
];

export const Navigation: React.FC<NavigationProps> = ({ onMenuClick }) => {
  const [activeSection, setActiveSection] = useState("hero");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Determine active section based on scroll position
      const sections = navigationItems.map((item) =>
        document.getElementById(item.id)
      );
      
      // Find the current section - the one that has scrolled past the top
      let newActiveSection = "hero";
      const scrollPosition = window.scrollY + 100; // Small offset for better UX

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section) {
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + window.scrollY;
          
          // If we've scrolled past this section's top, it's the active one
          if (scrollPosition >= sectionTop) {
            newActiveSection = navigationItems[i].id;
            break;
          }
        }
      }

      setActiveSection(newActiveSection);
    };

    window.addEventListener("scroll", handleScroll);
    // Run initial check to set correct active section on mount
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleNavClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // ScrollAnchor is already positioned at -84px, so we scroll directly to it
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <NavContainer $isScrolled={isScrolled}>
      <NavContent>
        <NavLinks>
          {navigationItems.map((item) => (
            <NavLink key={item.id} $isActive={activeSection === item.id}>
              <a onClick={() => handleNavClick(item.id)}>{item.label}</a>
            </NavLink>
          ))}
        </NavLinks>
      </NavContent>
    </NavContainer>
  );
};

export default Navigation;
