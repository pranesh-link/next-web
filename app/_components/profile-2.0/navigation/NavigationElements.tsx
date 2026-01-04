import styled from "styled-components";

export const NavContainer = styled.nav<{ $isScrolled: boolean }>`
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

export const NavContent = styled.div`
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

export const NavLinks = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 8px;
  align-items: center;
`;

export const NavLink = styled.li<{ $isActive: boolean }>`
  a {
    display: block;
    padding: 10px 20px;
    color: ${(props) => (props.$isActive ? "#1f2937" : "#6b7280")};
    text-decoration: none;
    font-weight: ${(props) => (props.$isActive ? "700" : "600")};
    font-size: 15px;
    border-radius: 12px;
    background: ${(props) =>
      props.$isActive ? "rgba(31, 41, 55, 0.1)" : "transparent"};
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
      background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
    }

    &:hover {
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(55, 65, 81, 0.3);

      &::before {
        opacity: 1;
      }
    }

    &:active {
      transform: translateY(0);
    }
  }
`;
