"use client";
import React, { useContext } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import Avatar from "../shared/Avatar";
import DisplayPic from "@/_assets/display-pic.png";

/**
 * HeroSection Component
 * Modern hero section with gradient background, avatar, and introduction
 * Design choice: Large hero for strong first impression with animated gradient background
 */

const HeroContainer = styled.section`
  position: relative;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%);
  background-size: 200% 200%;
  animation: gradientShift 15s ease infinite;
  padding: 100px 20px 60px;
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  /* Animated background shapes */
  &::before,
  &::after {
    content: "";
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 20s ease-in-out infinite;
  }

  &::before {
    width: 300px;
    height: 300px;
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }

  &::after {
    width: 400px;
    height: 400px;
    bottom: 10%;
    right: 10%;
    animation-delay: 5s;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-30px) rotate(180deg);
    }
  }

  @media screen and (max-width: 768px) {
    min-height: 60vh;
    padding: 60px 20px 40px;

    &::before {
      width: 200px;
      height: 200px;
    }

    &::after {
      width: 250px;
      height: 250px;
    }
  }

  @media screen and (max-width: 480px) {
    padding: 50px 16px 30px;

    &::before {
      width: 150px;
      height: 150px;
    }

    &::after {
      width: 180px;
      height: 180px;
    }
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  width: 100%;
  padding: 0 16px;
  animation: fadeInUp 1s ease-out;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media screen and (max-width: 480px) {
    padding: 0 8px;
  }
`;

const AvatarWrapper = styled.div`
  margin-bottom: 32px;
  animation: fadeInScale 1s ease-out 0.2s both;

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const Name = styled.h1`
  font-size: 56px;
  font-weight: 800;
  color: white;
  margin: 0 0 16px 0;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  letter-spacing: -0.5px;
  animation: fadeInUp 1s ease-out 0.4s both;
  word-wrap: break-word;
  overflow-wrap: break-word;

  @media screen and (max-width: 768px) {
    font-size: 40px;
  }

  @media screen and (max-width: 480px) {
    font-size: 32px;
  }

  @media screen and (max-width: 360px) {
    font-size: 28px;
  }
`;

const JobRole = styled.h2`
  font-size: 28px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  animation: fadeInUp 1s ease-out 0.6s both;
  word-wrap: break-word;
  overflow-wrap: break-word;

  @media screen and (max-width: 768px) {
    font-size: 22px;
  }

  @media screen and (max-width: 480px) {
    font-size: 18px;
  }

  @media screen and (max-width: 360px) {
    font-size: 16px;
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  animation: bounce 2s infinite;
  cursor: pointer;
  z-index: 3;

  @keyframes bounce {
    0%,
    100% {
      transform: translate(-50%, 0);
    }
    50% {
      transform: translate(-50%, 10px);
    }
  }

  &::before {
    content: "↓";
    font-size: 32px;
    color: white;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  @media screen and (max-width: 768px) {
    bottom: 20px;

    &::before {
      font-size: 24px;
    }
  }
`;

export const HeroSection: React.FC = () => {
  const {
    data: { header },
  } = useContext(ProfileContext);

  const { name, currentJobRole } = header;

  const handleScrollDown = () => {
    window.scrollTo({
      top: window.innerHeight * 0.7,
      behavior: "smooth",
    });
  };

  return (
    <HeroContainer id="hero">
      <HeroContent>
        <AvatarWrapper>
          <Avatar src={DisplayPic.src} alt={name} size="large" />
        </AvatarWrapper>
        <Name>{name}</Name>
        <JobRole>{currentJobRole}</JobRole>
      </HeroContent>
      <ScrollIndicator onClick={handleScrollDown} />
    </HeroContainer>
  );
};

export default HeroSection;
