import styled from "styled-components";

export const MobileMenuContainer = styled.div`
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

export const MenuBar = styled.div<{ $isScrolled: boolean }>`
  background: ${(props) =>
    props.$isScrolled
      ? "var(--nav-bg)"
      : "var(--nav-bg-clear)"};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid
    ${(props) =>
      props.$isScrolled
        ? "var(--border)"
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

export const Logo = styled.button`
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  @media screen and (max-width: 480px) {
    font-size: 18px;
  }
`;

export const HamburgerButton = styled.button<{ $isOpen: boolean }>`
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
    background: var(--text);
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

export const Overlay = styled.div<{ $isOpen: boolean }>`
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

export const MenuPanel = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 280px;
  max-width: 85vw;
  background: var(--bg-elevated);
  border-left: 1px solid var(--border);
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

export const MenuHeader = styled.div`
  padding: 24px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const MenuTitle = styled.h3`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
`;

export const CloseButton = styled.button`
  background: var(--surface-hover);
  border: 1px solid var(--border);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-dim);
  font-size: 18px;
  transition: all 0.2s ease;

  &:hover {
    background: var(--border);
    color: var(--text);
  }
`;

export const MenuItems = styled.nav`
  flex: 1;
  padding: 12px 0;
`;

export const MenuItem = styled.button<{ $isActive: boolean; $index?: number }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: ${(props) =>
    props.$isActive ? "rgba(59, 130, 246, 0.08)" : "transparent"};
  border: none;
  border-left: 3px solid
    ${(props) => (props.$isActive ? "var(--accent)" : "transparent")};
  color: ${(props) => (props.$isActive ? "var(--text)" : "var(--text-muted)")};
  font-size: 15px;
  font-weight: ${(props) => (props.$isActive ? "600" : "500")};
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;
  font-family: inherit;

  &:hover {
    background: var(--surface);
    color: var(--text);
    border-left-color: rgba(59, 130, 246, 0.3);
  }
`;
