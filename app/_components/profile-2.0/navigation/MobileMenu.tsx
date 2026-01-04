"use client";
import React, { useEffect, useState } from "react";
import packageJson from "../../../../package.json";
import {
  MobileMenuContainer,
  MenuBar,
  Logo,
  HamburgerButton,
  Overlay,
  MenuPanel,
  MenuHeader,
  MenuTitle,
  CloseButton,
  MenuItems,
  MenuItem,
  MenuFooter,
} from "./MobileMenuElements";

/**
 * MobileMenu Component
 * Mobile hamburger menu with slide-in overlay
 * Features: Smooth animation, section navigation, backdrop blur
 */

interface MobileMenuProps {
  className?: string;
}

const navigationItems = [
  { id: "hero", label: "Home", icon: "🏠" },
  { id: "about", label: "About", icon: "👤" },
  { id: "skills", label: "Skills", icon: "⚡" },
  { id: "experience", label: "Experience", icon: "💼" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "open-source", label: "Projects", icon: "🚀" },
];

export const MobileMenu: React.FC<MobileMenuProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Determine active section
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

  useEffect(() => {
    // Prevent body scroll when menu is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleMenuItemClick = (sectionId: string) => {
    setIsOpen(false);

    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        // ScrollAnchor is already positioned at -80px (mobile), so we scroll directly to it
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 300); // Wait for menu close animation
  };

  const handleLogoClick = () => {
    setIsOpen(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <MobileMenuContainer className={className}>
      <MenuBar $isScrolled={isScrolled}>
        <Logo onClick={handleLogoClick}></Logo>
        <HamburgerButton
          $isOpen={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </HamburgerButton>
      </MenuBar>

      <Overlay $isOpen={isOpen} onClick={() => setIsOpen(false)} />

      <MenuPanel $isOpen={isOpen}>
        <MenuHeader>
          <MenuTitle>Menu</MenuTitle>
          <CloseButton onClick={() => setIsOpen(false)} aria-label="Close menu">
            ×
          </CloseButton>
        </MenuHeader>

        <MenuItems>
          {navigationItems.map((item) => (
            <MenuItem
              key={item.id}
              $isActive={activeSection === item.id}
              onClick={() => handleMenuItemClick(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </MenuItem>
          ))}
        </MenuItems>

        <MenuFooter>v{packageJson.version}</MenuFooter>
      </MenuPanel>
    </MobileMenuContainer>
  );
};

export default MobileMenu;
