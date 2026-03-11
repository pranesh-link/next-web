"use client";
import React, { useEffect, useState, useRef } from "react";
import styled from "styled-components";
import { useScrollReveal } from "@/_hooks/use-scroll-reveal";

const SectionContainer = styled.section`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px 0;
  box-sizing: border-box;

  @media screen and (max-width: 768px) {
    padding: 32px 20px 0;
  }

  @media screen and (max-width: 480px) {
    padding: 24px 16px 0;
  }
`;

const RevealWrapper = styled.div<{ $visible: boolean }>`
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transform: translateY(${(props) => (props.$visible ? "0" : "40px")})
    scale(${(props) => (props.$visible ? 1 : 0.97)});
  filter: blur(${(props) => (props.$visible ? "0px" : "6px")});
  transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1.2s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform, filter;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;

  @media screen and (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  @media screen and (max-width: 400px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
`;

const StatCard = styled.div`
  text-align: center;
  padding: 28px 16px;
  background: var(--surface);
  border: 1px solid var(--surface-hover);
  border-radius: 16px;
  transition: border-color 0.3s ease, background 0.3s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.2);
    background: rgba(59, 130, 246, 0.03);
  }

  @media screen and (max-width: 480px) {
    padding: 20px 12px;
  }
`;

const StatNumber = styled.div`
  font-size: 40px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -1px;
  line-height: 1;
  margin-bottom: 8px;

  span {
    color: var(--accent);
  }

  @media screen and (max-width: 768px) {
    font-size: 32px;
  }

  @media screen and (max-width: 480px) {
    font-size: 28px;
  }
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  @media screen and (max-width: 480px) {
    font-size: 11px;
  }
`;

interface CounterProps {
  end: number;
  suffix?: string;
  active: boolean;
  duration?: number;
}

const Counter: React.FC<CounterProps> = ({
  end,
  suffix = "",
  active,
  duration = 2000,
}) => {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!active || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [active, end, duration]);

  return (
    <StatNumber>
      {count}
      <span>{suffix}</span>
    </StatNumber>
  );
};

const stats = [
  { value: 13, suffix: "+", label: "Years Experience" },
  { value: 3, suffix: "", label: "Companies" },
  { value: 20, suffix: "+", label: "Skills" },
  { value: 6, suffix: "+", label: "Open Source Projects" },
];

export const DarkStatsSection: React.FC = () => {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

  return (
    <SectionContainer>
      <RevealWrapper ref={ref} $visible={isVisible}>
        <StatsGrid>
          {stats.map((stat, index) => (
            <StatCard key={index}>
              <Counter
                end={stat.value}
                suffix={stat.suffix}
                active={isVisible}
              />
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsGrid>
      </RevealWrapper>
    </SectionContainer>
  );
};

export default DarkStatsSection;
