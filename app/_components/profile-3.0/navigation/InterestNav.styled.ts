import styled, { keyframes } from "styled-components";

export const ProgressTrack = styled.div`
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  z-index: 900;
  background: transparent;

  @media screen and (max-width: 480px) {
    width: 2px;
  }
`;

export const ProgressFill = styled.div<{ $progress: number }>`
  width: 100%;
  height: ${(props) => props.$progress}%;
  background: linear-gradient(180deg, var(--accent) 0%, var(--accent-light) 100%);
  border-radius: 0 0 2px 2px;
  transition: height 0.15s linear;
  opacity: ${(props) => (props.$progress > 0 ? 0.6 : 0)};
`;

export const FABButton = styled.button<{ $visible: boolean }>`
  position: fixed;
  bottom: 28px;
  right: 24px;
  z-index: 1000;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid var(--border-strong);
  background: var(--bg-elevated);
  color: var(--text-dim);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  pointer-events: ${(props) => (props.$visible ? "auto" : "none")};
  transform: ${(props) =>
    props.$visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)"};

  &:hover {
    border-color: var(--accent);
    background: rgba(59, 130, 246, 0.1);
    transform: translateY(-2px) scale(1.05);
  }

  &:active {
    transform: translateY(0) scale(0.95);
  }

  @media screen and (max-width: 480px) {
    bottom: 20px;
    right: 16px;
    width: 44px;
    height: 44px;
    font-size: 18px;
  }
`;

export const SheetOverlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  opacity: ${(props) => (props.$open ? 1 : 0)};
  visibility: ${(props) => (props.$open ? "visible" : "hidden")};
  transition: all 0.3s ease;
`;

export const SheetPanel = styled.div<{ $open: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1200;
  background: var(--bg-elevated);
  border-top: 1px solid var(--border);
  border-radius: 20px 20px 0 0;
  transform: ${(props) =>
    props.$open ? "translateY(0)" : "translateY(100%)"};
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0 0 env(safe-area-inset-bottom, 16px);
  max-height: 70vh;

  @media screen and (min-width: 769px) {
    left: auto;
    right: 24px;
    bottom: 88px;
    width: 260px;
    border-radius: 16px;
    border: 1px solid var(--border);
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
    transform: ${(props) =>
      props.$open
        ? "translateY(0) scale(1)"
        : "translateY(10px) scale(0.95)"};
    opacity: ${(props) => (props.$open ? 1 : 0)};
    padding-bottom: 8px;
  }
`;

export const SheetHandle = styled.div`
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;

  &::after {
    content: "";
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--border-strong);
  }

  @media screen and (min-width: 769px) {
    display: none;
  }
`;

export const SheetTitle = styled.div`
  padding: 4px 20px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const SheetItems = styled.div`
  padding: 4px 8px;
`;

const sheetItemFade = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
`;

export const SheetItem = styled.button<{ $active: boolean; $index: number }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: ${(props) =>
    props.$active ? "rgba(59, 130, 246, 0.08)" : "transparent"};
  border: none;
  border-radius: 12px;
  color: ${(props) => (props.$active ? "var(--text)" : "var(--text-dim)")};
  font-size: 15px;
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  animation: ${sheetItemFade} 0.3s cubic-bezier(0.16, 1, 0.3, 1)
    ${(props) => props.$index * 0.05}s both;

  &:hover {
    background: var(--surface-hover);
    color: var(--text);
  }

  &:active {
    background: rgba(59, 130, 246, 0.1);
  }

  @media screen and (max-width: 480px) {
    padding: 16px;
    font-size: 16px;
  }
`;

export const SheetIcon = styled.span`
  font-size: 18px;
  line-height: 1;
`;

export const ActiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  margin-left: auto;
`;
