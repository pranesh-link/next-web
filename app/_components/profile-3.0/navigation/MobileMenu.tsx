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
      ? "rgba(10, 10, 10, 0.95)"
      : "rgba(10, 10, 10, 0.6)"};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid
    ${(props) =>
      props.$isScrolled
        ? "rgba(255, 255, 255, 0.08)"
        : "transparent"};
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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

const Logo = styled.button`
  font-size: 20px;
  font-weight: 700;
  color: #e5e5e5;
  letter-spacing: -0.5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

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
    width: 22px;
    height: 2px;
    background: #e5e5e5;
    border-radius: 2px;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &:nth-child(1) {
      transform: ${(props) =>
        props.$isOpen ? "translateY(7px) rotate(45deg)" : "none"};
    }
    &:nth-child(2) {
      opacity: ${(props) => (props.$isOpen ? "0" : "1")};
    }
    &:nth-child(3) {
      transform: ${(props) =>
        props.$isOpen ? "translateY(-7px) rotate(-45deg)" : "none"};
    }
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  opacity: ${(props) => (props.$isOpen ? "1" : "0")};
  visibility: ${(props) => (props.$isOpen ? "visible" : "hidden")};
  transition: all 0.3s ease;
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
  background: #111111;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  transform: ${(props) =>
    props.$isOpen ? "translateX(0)" : "translateX(100%)"};
  transition: transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MenuTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #e5e5e5;
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a1a1aa;
  font-size: 18px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e5e5e5;
  }
`;

const MenuItems = styled.nav`
  flex: 1;
  padding: 12px 0;
`;

const MenuItem = styled.button<{ $isActive: boolean; $index?: number }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: ${(props) =>
    props.$isActive ? "rgba(59, 130, 246, 0.08)" : "transparent"};
  border: none;
  border-left: 3px solid
    ${(props) => (props.$isActive ? "#3b82f6" : "transparent")};
  color: ${(props) => (props.$isActive ? "#e5e5e5" : "#71717a")};
  font-size: 15px;
  font-weight: ${(props) => (props.$isActive ? "600" : "500")};
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  font-family: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
    color: #e5e5e5;
    border-left-color: rgba(59, 130, 246, 0.3);
  }
`;

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
