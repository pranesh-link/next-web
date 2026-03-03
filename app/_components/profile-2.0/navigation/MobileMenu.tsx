"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import packageJson from "../../../../package.json";

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

const MobileMenuContainer = styled.div`
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000;
  display: none;

  @media screen and (max-width: 968px) {
    display: block;
  }
`;

const MenuBar = styled.div<{ $isScrolled: boolean }>`
  background: ${(props) =>
    props.$isScrolled
      ? "rgba(255, 255, 255, 0.95)"
      : "rgba(255, 255, 255, 0.7)"};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid
    ${(props) =>
      props.$isScrolled
        ? "rgba(102, 126, 234, 0.2)"
        : "rgba(255, 255, 255, 0.3)"};
  box-shadow: ${(props) =>
    props.$isScrolled ? "0 4px 20px rgba(0, 0, 0, 0.08)" : "none"};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;

  @media screen and (max-width: 480px) {
    padding: 12px 16px;
  }
`;

const Logo = styled.div`
  font-size: 20px;
  font-weight: 800;
  color: #1f2937;
  user-select: none;

  @media screen and (max-width: 480px) {
    font-size: 18px;
  }
`;

const HamburgerButton = styled.button<{ $isOpen: boolean }>`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 32px;
  height: 32px;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1100;

  span {
    display: block;
    width: 24px;
    height: 3px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    border-radius: 2px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;

    &:nth-child(1) {
      transform: ${(props) =>
        props.$isOpen ? "translateY(8px) rotate(45deg)" : "none"};
    }

    &:nth-child(2) {
      opacity: ${(props) => (props.$isOpen ? "0" : "1")};
      transform: ${(props) => (props.$isOpen ? "translateX(-10px)" : "none")};
    }

    &:nth-child(3) {
      transform: ${(props) =>
        props.$isOpen ? "translateY(-8px) rotate(-45deg)" : "none"};
    }
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: ${(props) => (props.$isOpen ? "1" : "0")};
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1050;
  backdrop-filter: blur(4px);
`;

const MenuPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 85vw;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 249, 250, 0.98) 100%
  );
  backdrop-filter: blur(40px);
  box-shadow: -4px 0 30px rgba(0, 0, 0, 0.15);
  transform: ${(props) =>
    props.$isOpen ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  box-sizing: border-box;

  @media screen and (max-width: 480px) {
    width: 100%;
    max-width: 100vw;
  }
`;

const MenuHeader = styled.div`
  padding: 24px 20px;
  border-bottom: 2px solid rgba(99, 102, 241, 0.2);
  background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media screen and (max-width: 480px) {
    padding: 20px 16px;
  }
`;

const MenuTitle = styled.h3`
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media screen and (max-width: 480px) {
    font-size: 20px;
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: white;
  font-size: 24px;
  font-weight: 300;
  line-height: 1;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }

  &:active {
    background: rgba(255, 255, 255, 0.4);
    transform: rotate(90deg) scale(0.95);
  }

  @media screen and (max-width: 480px) {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
`;

const MenuItems = styled.nav`
  flex: 1;
  padding: 20px 0;
`;

const MenuItem = styled.button<{ $isActive: boolean; $index?: number }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: ${(props) =>
    props.$isActive ? "rgba(99, 102, 241, 0.1)" : "transparent"};
  border: none;
  border-left: 4px solid
    ${(props) => (props.$isActive ? "#6366f1" : "transparent")};
  color: ${(props) => (props.$isActive ? "#312e81" : "#64748b")};
  font-size: 16px;
  font-weight: ${(props) => (props.$isActive ? "700" : "600")};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  font-family: inherit;
  opacity: 0;
  animation: slideInItem 0.3s ease-out forwards;
  animation-delay: ${(props) => ((props.$index || 0) * 0.05 + 0.15)}s;

  @keyframes slideInItem {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &:hover {
    background: rgba(99, 102, 241, 0.08);
    border-left-color: #6366f1;
    color: #312e81;
    padding-left: 24px;
  }

  &:active {
    background: rgba(31, 41, 55, 0.15);
  }

  span.icon {
    font-size: 20px;
    min-width: 24px;
    text-align: center;
  }

  @media screen and (max-width: 480px) {
    padding: 14px 16px;
    font-size: 15px;
  }
`;

const MenuFooter = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
  text-align: center;
  color: #6b7280;
  font-size: 13px;

  @media screen and (max-width: 480px) {
    padding: 16px;
    font-size: 12px;
  }
`;

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
