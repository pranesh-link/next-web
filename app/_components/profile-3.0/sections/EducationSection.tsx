"use client";
import React, { useContext } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { DarkCard, DarkCardHeader, DarkCardContent } from "../shared/Card";
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

const EducationText = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: #a1a1aa;

  strong {
    color: #3b82f6;
    font-weight: 600;
  }

  @media screen and (max-width: 768px) {
    font-size: 15px;
  }
`;

export const DarkEducationSection: React.FC = () => {
  const {
    data: {
      sections: { education },
    },
  } = useContext(ProfileContext);
  const { ref, isVisible } = useScrollReveal();

  return (
    <SectionContainer>
      <ScrollAnchor id="education" />
      <SectionTitle>{education.title}</SectionTitle>
      <RevealWrapper ref={ref} $visible={isVisible}>
        <DarkCard>
          <DarkCardHeader>Academic Background</DarkCardHeader>
          <DarkCardContent>
            <EducationText
              dangerouslySetInnerHTML={{ __html: education.info }}
            />
          </DarkCardContent>
        </DarkCard>
      </RevealWrapper>
    </SectionContainer>
  );
};

export default DarkEducationSection;
