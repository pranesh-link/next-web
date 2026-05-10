"use client";
import React, { useEffect, useState } from "react";
import {
  CloseButton,
  HamburgerButton,
  Logo,
  MenuBar,
  MenuHeader,
  MenuItem,
  MenuItems,
  MenuPanel,
  MenuTitle,
  MobileMenuContainer,
  Overlay,
} from "./MobileMenu.styled";

const navigationItems = [
  { id: "hero", label: "Home" },
  // { id: "about", label: "About" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "education", label: "Education" },
  { id: "open-source", label: "Projects" },
];

/**
 * Dark-themed mobile hamburger menu used in profile-3.0. Tracks the
 * active section by scroll position and provides smooth-scroll
 * navigation.
 *
 * @returns The mobile navigation menu element.
 */
export const DarkMobileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = navigationItems.map((item) =>
        document.getElementById(item.id)
      );
      let newActiveSection = "hero";
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section) {
          const sectionTop =
            section.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= sectionTop) {
            newActiveSection = navigationItems[i].id;
            break;
          }
        }
      }
      setActiveSection(newActiveSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleNavClick = (sectionId: string) => {
    setIsOpen(false);
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offsetPosition =
          element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    }, 300);
  };

  return (
    <MobileMenuContainer>
      <MenuBar $isScrolled={isScrolled}>
        <Logo onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>PG</Logo>
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
          <MenuTitle>Explore</MenuTitle>
          <CloseButton onClick={() => setIsOpen(false)} aria-label="Close menu">
            ✕
          </CloseButton>
        </MenuHeader>
        <MenuItems>
          {navigationItems.map((item, index) => (
            <MenuItem
              key={item.id}
              $isActive={activeSection === item.id}
              $index={index}
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </MenuItem>
          ))}
        </MenuItems>
      </MenuPanel>
    </MobileMenuContainer>
  );
};

export default DarkMobileMenu;
