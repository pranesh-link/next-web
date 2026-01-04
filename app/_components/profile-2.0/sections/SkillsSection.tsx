"use client";
import React, { useContext } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { Card } from "../shared/Card";
import SkillBadge from "../shared/SkillBadge";

/**
 * SkillsSection Component
 * Displays skills with star ratings in a modern grid layout
 * Design choice: Flexbox layout for natural wrapping and responsive behavior
 */

const SectionContainer = styled.section`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 20px 80px;
  background: linear-gradient(180deg, transparent 0%, rgba(55, 65, 81, 0.03) 100%);
  box-sizing: border-box;
  position: relative;

  @media screen and (max-width: 768px) {
    padding: 20px 20px 60px;
  }

  @media screen and (max-width: 480px) {
    padding: 20px 16px 40px;
  }
`;

const ScrollAnchor = styled.div`
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

const SectionTitle = styled.h2`
  font-size: 48px;
  font-weight: 800;
  text-align: center;
  margin: 0 0 48px 0;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
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

const SkillsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 24px;

  @media screen and (max-width: 968px) {
    gap: 14px;
  }

  @media screen and (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media screen and (max-width: 480px) {
    gap: 10px;
  }

  @media screen and (max-width: 360px) {
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const SkillCategory = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CategoryTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "";
    width: 4px;
    height: 24px;
    background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
    border-radius: 2px;
  }

  @media screen and (max-width: 768px) {
    font-size: 18px;

    &::before {
      height: 20px;
    }
  }
`;

export const SkillsSection: React.FC = () => {
  const {
    data: {
      sections: { skills },
    },
  } = useContext(ProfileContext);

  // Sort skills by rating (highest first)
  const sortedSkills = [...skills.info].sort((a, b) => b.star - a.star);

  // Group skills by rating for better organization (optional)
  const expertSkills = sortedSkills.filter((skill) => skill.star >= 4);
  const proficientSkills = sortedSkills.filter(
    (skill) => skill.star >= 2 && skill.star < 4
  );
  const learningSkills = sortedSkills.filter((skill) => skill.star < 2);

  return (
    <SectionContainer>
      <ScrollAnchor id="skills" />
      <SectionTitle>{skills.title}</SectionTitle>

      <Card>
        {/* Expert Level Skills */}
        {expertSkills.length > 0 && (
          <SkillCategory>
            <CategoryTitle>Expert & Advanced Skills</CategoryTitle>
            <SkillsGrid>
              {expertSkills.map((skill, index) => (
                <SkillBadge
                  key={index}
                  label={skill.label}
                  rating={skill.star}
                />
              ))}
            </SkillsGrid>
          </SkillCategory>
        )}

        {/* Proficient Skills */}
        {proficientSkills.length > 0 && (
          <SkillCategory>
            <CategoryTitle>Proficient Skills</CategoryTitle>
            <SkillsGrid>
              {proficientSkills.map((skill, index) => (
                <SkillBadge
                  key={index}
                  label={skill.label}
                  rating={skill.star}
                />
              ))}
            </SkillsGrid>
          </SkillCategory>
        )}

        {/* Learning Skills */}
        {learningSkills.length > 0 && (
          <SkillCategory>
            <CategoryTitle>Currently Learning</CategoryTitle>
            <SkillsGrid>
              {learningSkills.map((skill, index) => (
                <SkillBadge
                  key={index}
                  label={skill.label}
                  rating={skill.star}
                />
              ))}
            </SkillsGrid>
          </SkillCategory>
        )}

        {/* Fallback: Show all skills if no categorization */}
        {expertSkills.length === 0 &&
          proficientSkills.length === 0 &&
          learningSkills.length === 0 && (
            <SkillsGrid>
              {sortedSkills.map((skill, index) => (
                <SkillBadge
                  key={index}
                  label={skill.label}
                  rating={skill.star}
                />
              ))}
            </SkillsGrid>
          )}
      </Card>
    </SectionContainer>
  );
};

export default SkillsSection;
