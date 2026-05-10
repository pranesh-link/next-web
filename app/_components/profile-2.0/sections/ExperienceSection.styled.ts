import styled from "styled-components";

export const SectionContainer = styled.section`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 20px 80px;
  box-sizing: border-box;
  position: relative;

  @media screen and (max-width: 768px) {
    padding: 20px 20px 60px;
  }

  @media screen and (max-width: 480px) {
    padding: 20px 16px 40px;
  }
`;

export const ScrollAnchor = styled.div`
  position: absolute;
  top: -84px;
  left: 0;
  height: 1px;
  width: 1px;
  pointer-events: none;

  @media screen and (max-width: 968px) {
    top: -80px;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 48px;
  font-weight: 800;
  text-align: center;
  margin: 0 0 48px 0;
  background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media screen and (max-width: 768px) {
    font-size: 36px;
    margin-bottom: 36px;
  }

  @media screen and (max-width: 480px) {
    font-size: 28px;
    margin-bottom: 28px;
  }

  @media screen and (max-width: 360px) {
    font-size: 24px;
    margin-bottom: 24px;
  }
`;

export const Timeline = styled.div`
  position: relative;
  padding-left: 40px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
    border-radius: 2px;
  }

  @media screen and (max-width: 768px) {
    padding-left: 24px;

    &::before {
      width: 3px;
    }
  }

  @media screen and (max-width: 480px) {
    padding-left: 16px;

    &::before {
      width: 2px;
    }
  }
`;

export const TimelineItem = styled.div<{ $index: number }>`
  --index: ${(p) => p.$index};
  position: relative;
  margin-bottom: 32px;
  animation: fadeInLeft 0.6s ease-out both;
  animation-delay: calc(var(--index) * 0.1s);

  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  &::before {
    content: "";
    position: absolute;
    left: -49px;
    top: 24px;
    width: 16px;
    height: 16px;
    background: white;
    border: 4px solid #6366f1;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  }

  @media screen and (max-width: 768px) {
    margin-bottom: 24px;

    &::before {
      left: -32px;
      width: 12px;
      height: 12px;
      border-width: 3px;
      top: 20px;
    }
  }

  @media screen and (max-width: 480px) {
    margin-bottom: 20px;

    &::before {
      left: -23px;
      width: 10px;
      height: 10px;
      border-width: 2px;
      top: 18px;
    }
  }
`;
