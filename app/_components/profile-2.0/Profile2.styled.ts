"use client";
import styled, { createGlobalStyle } from "styled-components";

// Global styles to prevent horizontal scroll
export const GlobalStyle = createGlobalStyle`
  html, body {
    overflow-x: hidden;
    max-width: 100vw;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  /* Ensure fixed positioning works correctly */
  body {
    position: static !important;
    transform: none !important;
    perspective: none !important;
    backface-visibility: visible !important;
  }
`;

export const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(
    180deg,
    #f8f9fa 0%,
    #ffffff 50%,
    #f8f9fa 100%
  );
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;
`;

export const ContentWrapper = styled.main`
  position: relative;
  z-index: 1;
`;

export const FloatingShapes = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.5;

  /* Animated background shapes for depth */
  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    will-change: transform;
    background: radial-gradient(
      circle,
      rgba(99, 102, 241, 0.08) 0%,
      transparent 70%
    );
    animation: float 20s ease-in-out infinite;
  }

  &::before {
    width: 400px;
    height: 400px;
    top: 20%;
    right: -100px;
    animation-delay: 0s;
  }

  &::after {
    width: 300px;
    height: 300px;
    bottom: 20%;
    left: -50px;
    animation-delay: 10s;
  }

  @media screen and (max-width: 768px) {
    &::before {
      width: 250px;
      height: 250px;
    }

    &::after {
      width: 200px;
      height: 200px;
    }
  }

  @media screen and (max-width: 480px) {
    &::before {
      width: 150px;
      height: 150px;
    }

    &::after {
      width: 120px;
      height: 120px;
    }
  }

  @keyframes float {
    0%,
    100% {
      transform: translate(0, 0) rotate(0deg);
    }
    33% {
      transform: translate(30px, -30px) rotate(120deg);
    }
    66% {
      transform: translate(-20px, 20px) rotate(240deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &::before,
    &::after {
      animation: none;
    }
  }
`;

export const ScrollToTop = styled.button`
  position: fixed;
  bottom: 120px;
  right: 40px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 900;
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);

  &.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 30px rgba(99, 102, 241, 0.5);
  }

  &:active {
    transform: translateY(-2px);
  }

  @media screen and (max-width: 768px) {
    bottom: 100px;
    right: 24px;
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  @media screen and (max-width: 480px) {
    bottom: 90px;
    right: 16px;
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
`;
