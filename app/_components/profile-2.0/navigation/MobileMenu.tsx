"use client";
import React, { useEffect, useState } from "react";
import packageJson from "../../../../package.json";
import {
  CloseButton,
  HamburgerButton,
  Logo,
  MenuBar,
  MenuFooter,
  MenuHeader,
  MenuItem,
  MenuItems,
  MenuPanel,
  MenuTitle,
  MobileMenuContainer,
  Overlay,
} from "./MobileMenu.styled";

/**
 * Props for the {@link MobileMenu} component.
 */
interface MobileMenuProps {
  /** Optional className applied to the root container. */
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

/**
 * Mobile hamburger menu with slide-in overlay for the profile-2.0 layout.
 *
 * @param props - {@link MobileMenuProps}.
 * @returns The mobile navigation menu element.
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({ className }) => {
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
          const rect = section.getBoundingClientRect();
          const sectionTop = rect.top + window.scrollY;

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

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
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
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 300);
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
          {navigationItems.map((item, index) => (
            <MenuItem
              key={item.id}
              $isActive={activeSection === item.id}
              $index={index}
              onClick={() => handleMenuItemClick(item.id)}
            >
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
