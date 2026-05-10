import styled, { keyframes } from "styled-components";

export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.97);
    filter: blur(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0px);
  }
`;

export const ambientFade = keyframes`
  from { opacity: 0; }
  to { opacity: 0.5; }
`;

export const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

export const HeroContainer = styled.section`
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
`;

export const ParticleGrid = styled.div<{ $scrollY: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
    var(--particle-dot) 1px,
    transparent 1px
  );
  background-size: 40px 40px;
  opacity: 0;
  animation: ${ambientFade} 2s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
  transform: translateY(${(props) => props.$scrollY * 0.4}px);
  will-change: transform;
`;

export const MouseGradient = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  width: 800px;
  height: 800px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    var(--gradient-mouse) 0%,
    rgba(34, 211, 238, 0.03) 30%,
    transparent 60%
  );
  top: ${(props) => props.$y}px;
  left: ${(props) => props.$x}px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: top 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    left 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  @media screen and (max-width: 768px) {
    width: 500px;
    height: 500px;
  }
`;

export const HeroContent = styled.div<{ $scrollY: number }>`
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  width: 100%;
  padding: 0 24px;
  transform: translateY(${(props) => props.$scrollY * -0.15}px);
  will-change: transform;
`;

export const Name = styled.h1`
  font-size: 72px;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 12px 0;
  letter-spacing: -2px;
  line-height: 1.1;
  animation: ${fadeIn} 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;

  @media screen and (max-width: 768px) {
    font-size: 48px;
    letter-spacing: -1px;
  }

  @media screen and (max-width: 480px) {
    font-size: 36px;
  }

  @media screen and (max-width: 360px) {
    font-size: 30px;
  }
`;

export const JobRole = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: var(--accent-lighter);
  margin: 0 0 32px 0;
  animation: ${fadeIn} 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.6s both;

  @media screen and (max-width: 768px) {
    font-size: 20px;
  }

  @media screen and (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 24px;
  }
`;

export const TaglineWrapper = styled.div`
  font-size: 17px;
  line-height: 1.7;
  color: var(--text-dim);
  max-width: 640px;
  margin: 0 auto;
  min-height: 1.7em;
  animation: ${fadeIn} 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.9s both;

  @media screen and (max-width: 768px) {
    font-size: 15px;
  }

  @media screen and (max-width: 480px) {
    font-size: 14px;
  }
`;

export const Cursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--accent-light);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ${blink} 0.8s step-end infinite;
`;

export const PillsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 40px;
  animation: ${fadeIn} 1.2s cubic-bezier(0.16, 1, 0.3, 1) 3s both;

  @media screen and (max-width: 480px) {
    margin-top: 28px;
    gap: 8px;
    overflow-x: auto;
    flex-wrap: nowrap;
    justify-content: flex-start;
    padding: 0 4px 8px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }
`;

export const Pill = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  color: var(--text-dim);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.08);
    color: var(--text);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  @media screen and (max-width: 480px) {
    font-size: 12px;
    padding: 8px 14px;
    gap: 6px;
    flex-shrink: 0;
  }
`;

export const PillIcon = styled.span`
  font-size: 15px;
  line-height: 1;
`;
