"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

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

const NavContainer = styled.nav<{ $isScrolled: boolean }>`
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000;
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
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;

  @media screen and (max-width: 968px) {
    display: none;
  }
`;

const NavContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;

  @media screen and (max-width: 1240px) {
    padding: 16px 20px;
  }
`;

const NavLinks = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
  align-items: center;
`;

const NavLink = styled.li<{ $isActive: boolean }>`
  a {
    display: block;
    padding: 10px 20px;
    color: ${(props) => (props.$isActive ? "#312e81" : "#64748b")};
    text-decoration: none;
    font-weight: ${(props) => (props.$isActive ? "700" : "600")};
    font-size: 15px;
    border-radius: 12px;
    background: ${(props) =>
      props.$isActive ? "rgba(99, 102, 241, 0.1)" : "transparent"};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    /* Active indicator bar */
    ${(props) => props.$isActive && `
      &::after {
        content: "";
        position: absolute;
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 3px;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        border-radius: 2px;
      }
    `}

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
    }

    &:hover {
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);

      &::before {
        opacity: 1;
      }

      &::after {
        display: none;
      }
    }

    &:active {
      transform: translateY(0);
    }
  }
`;

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
