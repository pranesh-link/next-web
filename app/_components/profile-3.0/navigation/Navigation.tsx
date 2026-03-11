"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

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
      ? "rgba(10, 10, 10, 0.95)"
      : "rgba(10, 10, 10, 0.6)"};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid
    ${(props) =>
      props.$isScrolled
        ? "rgba(255, 255, 255, 0.08)"
        : "transparent"};
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
  justify-content: center;
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
  gap: 4px;
  align-items: center;
`;

const NavLink = styled.li<{ $isActive: boolean }>`
  a {
    display: block;
    padding: 8px 18px;
    color: ${(props) => (props.$isActive ? "#e5e5e5" : "#71717a")};
    text-decoration: none;
    font-weight: ${(props) => (props.$isActive ? "600" : "500")};
    font-size: 14px;
    border-radius: 8px;
    background: ${(props) =>
      props.$isActive ? "rgba(59, 130, 246, 0.12)" : "transparent"};
    transition: all 0.25s ease;
    cursor: pointer;
    letter-spacing: 0.3px;

    &:hover {
      color: #e5e5e5;
      background: rgba(255, 255, 255, 0.06);
    }
  }
`;

export const DarkNavigation: React.FC = () => {
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

  const handleNavClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetPosition =
        element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
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

export default DarkNavigation;
