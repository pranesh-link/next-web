"use client";
import React, { useContext } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import DarkSkillBadge from "../shared/SkillBadge";
import { useScrollReveal } from "@/_hooks/use-scroll-reveal";

const SectionContainer = styled.section`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 80px 24px;
  box-sizing: border-box;
  position: relative;

  @media screen and (max-width: 768px) {
    padding: 60px 20px;
  }

  @media screen and (max-width: 480px) {
    padding: 40px 16px;
  }
`;

const ScrollAnchor = styled.div`
  position: absolute;
  top: -84px;
  left: 0;
  height: 1px;
  width: 1px;
  pointer-events: none;
`;

const SectionTitle = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0 0 48px 0;
  text-align: center;

  @media screen and (max-width: 768px) {
    margin-bottom: 36px;
  }
`;

const RevealWrapper = styled.div<{ $visible: boolean }>`
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transform: translateY(${(props) => (props.$visible ? 0 : "30px")});
  transition: all 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
`;

const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;

  @media screen and (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  @media screen and (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
`;

export const DarkSkillsSection: React.FC = () => {
  const {
    data: {
      sections: { skills },
    },
  } = useContext(ProfileContext);
  const { ref, isVisible } = useScrollReveal();

  const sortedSkills = [...skills.info].sort((a, b) => b.star - a.star);

  return (
    <SectionContainer>
      <ScrollAnchor id="skills" />
      <SectionTitle>{skills.title}</SectionTitle>
      <RevealWrapper ref={ref} $visible={isVisible}>
        <SkillsGrid>
          {sortedSkills.map((skill, index) => (
            <DarkSkillBadge key={index} label={skill.label} />
          ))}
        </SkillsGrid>
      </RevealWrapper>
    </SectionContainer>
  );
};

export default DarkSkillsSection;
