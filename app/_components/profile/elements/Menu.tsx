import styled from "styled-components";
import { FlexBoxSection } from "@/_components/common/Elements";

/** Fixed top header that hosts the mobile hamburger toggle. */
export const IconWrap = styled.div`
  display: flex;
  justify-content: flex-end;
  position: fixed;
  width: 100%;
  z-index: 20;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  padding: 15px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .hamburger-icon {
    margin-right: 15px;
    cursor: pointer;
    padding: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all var(--transition-normal);
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    &:active {
      transform: scale(0.95);
    }
    
    &.clicked {
      background: rgba(102, 126, 234, 0.8);
      border-color: rgba(102, 126, 234, 1);
      
      svg {
        color: white;
      }
    }
  }

  @media screen and (min-width: 768px) {
    display: none;
  }
`;

/** Full-screen overlay container used by the mobile slide-in menu. */
export const Menu = styled.div`
  display: flex;
  position: fixed;
  flex-direction: row-reverse;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 100011;
  transition: all 0.3s ease-in-out;
  
  &.exited {
    visibility: hidden;
  }
  
  &.entered {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
  }
`;

/** Right-hand drawer content section inside the mobile `Menu` overlay. */
export const ContentSection = styled(FlexBoxSection)`
  background: linear-gradient(135deg, rgba(34, 34, 34, 0.95) 0%, rgba(68, 68, 68, 0.95) 100%);
  backdrop-filter: blur(20px);
  flex-basis: 280px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.3);
  
  .find-me {
    align-self: center;
    color: rgba(255, 255, 255, 0.9);
    padding: 16px 20px;
    font-style: italic;
    font-weight: 600;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 16px;
    background: rgba(102, 126, 234, 0.1);
  }
  
  .close-button {
    cursor: pointer;
    margin: 15px;
    height: 32px;
    width: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-normal);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    svg {
      color: rgba(255, 255, 255, 0.9);
    }
  }
`;

/** Transparent right-side region of the mobile `Menu` overlay used to dismiss it. */
export const RightSection = styled.div`
  flex-basis: calc(100% - 280px);
  background: transparent;
`;
