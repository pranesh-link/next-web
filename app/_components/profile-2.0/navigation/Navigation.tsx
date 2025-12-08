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
  z-index: 9999 !important;
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

const Logo = styled.div`
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  user-select: none;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
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
    color: ${(props) => (props.$isActive ? "#2563eb" : "#4b5563")};
    text-decoration: none;
    font-weight: ${(props) => (props.$isActive ? "700" : "600")};
    font-size: 15px;
    border-radius: 12px;
    background: ${(props) =>
      props.$isActive ? "rgba(37, 99, 235, 0.1)" : "transparent"};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
    }

    &:hover {
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);

      &::before {
        opacity: 1;
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

      // Only update active section if we're not at the very top
      if (window.scrollY < 10) {
        setActiveSection("hero");
        return;
      }

      // Determine active section based on scroll position
      const sections = navigationItems.map((item) =>
        document.getElementById(item.id)
      );
      const navHeight = 64;
      const gap = 20;
      const offset = navHeight + gap;

      // Current scroll position (top of viewport + nav height + gap)
      const scrollPosition = window.scrollY + offset;

      // Find the active section - the one whose top is closest to and below the scroll position
      let newActiveSection = "hero"; // Default to hero

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (section) {
          const sectionTop = section.offsetTop;
          // Check if we've scrolled past this section's start
          if (scrollPosition >= sectionTop) {
            newActiveSection = navigationItems[i].id;
          } else {
            // Once we find a section we haven't reached yet, stop
            break;
          }
        }
      }

      setActiveSection(newActiveSection);
    };

    window.addEventListener("scroll", handleScroll);
    // Run initial check after a brief delay to ensure DOM is ready
    const timer = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
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

  const handleLogoClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  console.log("activeSection:", activeSection);

  return (
    <NavContainer $isScrolled={isScrolled}>
      <NavContent>
        <Logo onClick={handleLogoClick}>Pranesh</Logo>
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
