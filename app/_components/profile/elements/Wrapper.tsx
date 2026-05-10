import styled from "styled-components";

/** Page-level wrapper applying gradient background, PWA-aware margins and animations. */
export const Wrapper = styled.section<{ $pwaOffset: number }>`
  &:not(.isMobile) {
    padding-top: 100px;
  }
  &:not(.export) {
    background: transparent;
    min-height: 100vh;
    position: relative;
    
    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 50%, #134e4a 100%);
      z-index: -2;
    }
    
    &::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      z-index: -1;
    }
    
    &.add-margin-top {
      margin-top: ${(props) => props.$pwaOffset || 0}px;
      animation: ease-in-m-t 0.6s ease-out forwards;
      @keyframes ease-in-m-t {
        from {
          margin-top: 0;
          opacity: 0;
        }
        to {
          margin-top: ${(props) => props.$pwaOffset || 0}px;
          opacity: 1;
        }
      }
    }
    &.add-margin-bottom {
      margin-bottom: 90px;
      animation: ease-in-m-b 0.6s ease-out forwards;
      @keyframes ease-in-m-b {
        from {
          margin-bottom: 0;
        }
        to {
          margin-bottom: 90px;
        }
      }
    }
  }

  .header-sep {
    min-width: 100px;
    opacity: 0.6;
    height: 0;
    border-top: 5px solid #22a39f;
    margin: 0 10px;
    &.export {
      display: none;
    }
    @media screen and (max-width: 767px) {
      display: none;
    }
  }
`;
