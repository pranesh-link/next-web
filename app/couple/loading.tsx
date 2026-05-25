"use client";

import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  animation: ${fadeIn} 0.3s ease-out;
`;

const Brand = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.5px;
  margin: 0;
`;

const Tagline = styled.p`
  font-size: 14px;
  color: var(--text-muted);
  margin: 8px 0 0;
  letter-spacing: 0.3px;
`;

const Dots = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 32px;
`;

const Dot = styled.span<{ $delay: number }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: ${pulse} 1.2s ease-in-out infinite;
  animation-delay: ${(p) => p.$delay}ms;
`;

/** Loading screen for the LuvVerse couple module. */
export default function CoupleLoading() {
  return (
    <Wrapper>
      <Brand>LuvVerse</Brand>
      <Tagline>Everyday for the couple</Tagline>
      <Dots>
        <Dot $delay={0} />
        <Dot $delay={200} />
        <Dot $delay={400} />
      </Dots>
    </Wrapper>
  );
}
