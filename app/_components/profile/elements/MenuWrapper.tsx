import styled from "styled-components";
import { ActionBtn } from "@/_components/common/Elements";

/** Top navigation bar; switches between desktop pill nav and mobile drawer styling. */
export const MenuWrapper = styled.nav`
  overflow: visible;
  position: fixed;
  width: 100%;
  z-index: 1000;
  transition: all var(--transition-normal);
  pointer-events: none;

  &.mobile {
    padding-top: 0;
    position: static;
    max-width: unset;
    height: 100%;
    background: rgba(34, 34, 34, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 0;
    opacity: 1;
    transform: none;
    animation: none;
    pointer-events: auto;
    
    > section {
      flex-direction: column;
    }
  }
  
  &:not(.mobile) {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(30px) saturate(130%);
    padding: 10px 24px;
    border-radius: 100px;
    position: fixed !important;
    left: 50%;
    top: 24px !important;
    transform: translateX(-50%);
    max-width: max-content;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 
                0 2px 8px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: opacity, box-shadow, background-color;
    pointer-events: auto;
    
    /* Initial load animation */
    opacity: 0;
    animation: navFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
    
    @keyframes navFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    /* Enhanced transparency on scroll */
    &.scrolled {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(40px) saturate(160%);
      border-color: rgba(255, 255, 255, 0.18);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15),
                  0 4px 12px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2);
      padding: 8px 20px;
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.14);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18),
                  0 6px 16px rgba(0, 0, 0, 0.12),
                  inset 0 1px 0 rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.28);
      backdrop-filter: blur(35px) saturate(150%);
      transform: translateX(-50%) translateY(-2px);
    }
  }
  
  &.wrapper {
    ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      
      @media screen and (max-width: 767px) {
        flex-direction: column;
      }
    }
    
    li {
      text-align: center;
      padding: 8px 0;
      
      @media screen and (max-width: 767px) {
        width: 100%;
        padding: 20px 5px;
      }
    }
    
    a {
      font-weight: 600;
      padding: 12px 20px;
      text-decoration: none;
      color: rgba(255, 255, 255, 0.9);
      border-radius: 25px;
      transition: all var(--transition-normal);
      display: inline-block;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      
      &:hover {
        color: var(--color-white);
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      @media screen and (max-width: 767px) {
        color: #fff;
        padding: 20px 5px;
        width: 100%;
        border-radius: 0;
        
        &:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          transform: none;
        }
      }
    }
  }

  @media only screen and (max-width: 767px) {
    border-radius: 0px;
    &:not(.mobile) {
      display: none;
      right: 0;
    }
  }
`;

/** Pill-styled top-bar nav button; supports `is-active` and `home` variants. */
export const MenuButton = styled(ActionBtn)`
  margin-right: 8px;
  padding: 8px 18px;
  border-radius: 24px;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  position: relative;
  font-size: 14px;
  white-space: nowrap;
  
  &.is-active {
    background: rgba(255, 255, 255, 0.22);
    color: var(--color-white);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(12px);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  &.home {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-right: 16px;
    padding-right: 16px;
    border-right: 1px solid rgba(255, 255, 255, 0.15);
    
    .back-arrow {
      transition: transform 0.3s ease;
    }
  }
  
  &:hover:not(.is-active) {
    background: rgba(255, 255, 255, 0.15);
    color: var(--color-white);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.2);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    
    &.home .back-arrow {
      transform: translateX(-2px);
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:last-child {
    margin-right: 0;
  }
  
  @media screen and (max-width: 1024px) {
    padding: 7px 14px;
    font-size: 13px;
    margin-right: 6px;
  }
  
  @media screen and (max-width: 767px) {
    padding: 6px 12px;
    font-size: 12px;
    margin-right: 4px;
  }
`;

/** Full-width mobile-drawer nav button with left highlight bar on `is-active`. */
export const MobileMenuBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  padding: 16px 24px;
  width: 100%;
  text-align: left;
  transition: all var(--transition-normal);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transition: width var(--transition-normal);
  }
  
  &.is-active {
    background: rgba(102, 126, 234, 0.2);
    color: #ffffff;
    
    &::before {
      width: 4px;
    }
  }
  
  &:hover:not(.is-active) {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: translateX(8px);
  }
  
  &:active {
    transform: translateX(4px);
  }
`;
