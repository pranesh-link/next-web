"use client";
import React, { useContext } from "react";
import styled, { keyframes } from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const HeroContainer = styled.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0a;
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
`;

const ParticleGrid = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
    rgba(59, 130, 246, 0.15) 1px,
    transparent 1px
  );
  background-size: 40px 40px;
  opacity: 0.5;
`;

const GradientOrb = styled.div`
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(34, 211, 238, 0.04) 40%,
    transparent 70%
  );
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;

  @media screen and (max-width: 768px) {
    width: 400px;
    height: 400px;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  width: 100%;
  padding: 0 24px;
`;

const Name = styled.h1`
  font-size: 72px;
  font-weight: 800;
  color: #e5e5e5;
  margin: 0 0 12px 0;
  letter-spacing: -2px;
  line-height: 1.1;
  animation: ${fadeIn} 0.8s ease-out 0.4s both;

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

const JobRole = styled.h2`
  font-size: 24px;
  font-weight: 400;
  color: #93c5fd;
  margin: 0 0 32px 0;
  animation: ${fadeIn} 0.8s ease-out 0.6s both;

  @media screen and (max-width: 768px) {
    font-size: 20px;
  }

  @media screen and (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 24px;
  }
`;

const Tagline = styled.p`
  font-size: 17px;
  line-height: 1.7;
  color: #a1a1aa;
  margin: 0;
  max-width: 640px;
  margin: 0 auto;
  animation: ${fadeIn} 0.8s ease-out 0.8s both;

  @media screen and (max-width: 768px) {
    font-size: 15px;
  }

  @media screen and (max-width: 480px) {
    font-size: 14px;
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  animation: bounce 2.5s infinite;
  z-index: 3;

  @keyframes bounce {
    0%, 100% { transform: translate(-50%, 0); }
    50% { transform: translate(-50%, -12px); }
  }
`;

const ScrollLine = styled.div`
  width: 1px;
  height: 40px;
  background: linear-gradient(
    180deg,
    rgba(59, 130, 246, 0.5) 0%,
    transparent 100%
  );
  margin: 0 auto;
`;

export const DarkHeroSection: React.FC = () => {
  const {
    data: { header },
  } = useContext(ProfileContext);

  return (
    <HeroContainer id="hero">
      <ParticleGrid />
      <GradientOrb />
      <HeroContent>
        <Name>{header.greeting || header.name}</Name>
        <JobRole>{header.currentJobRole}</JobRole>
        {header.tagline && <Tagline>{header.tagline}</Tagline>}
      </HeroContent>
      <ScrollIndicator>
        <ScrollLine />
      </ScrollIndicator>
    </HeroContainer>
  );
};

export default DarkHeroSection;
