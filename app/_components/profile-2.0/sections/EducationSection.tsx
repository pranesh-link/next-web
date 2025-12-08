"use client";
import React, { useContext } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { Card, CardHeader, CardContent } from "../shared/Card";

/**
 * EducationSection Component
 * Displays educational background
 * Design choice: Clean card layout with academic information
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

const EducationText = styled.div`
  font-size: 18px;
  line-height: 1.8;
  color: #4b5563;
  margin: 0;
  white-space: pre-line;
  word-wrap: break-word;
  overflow-wrap: break-word;

  p {
    margin: 0 0 12px 0;
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 24px;
  }

  li {
    margin: 4px 0;
  }

  strong {
    color: #1f2937;
    font-weight: 700;
  }

  @media screen and (max-width: 768px) {
    font-size: 16px;
    line-height: 1.7;
  }
`;

export const EducationSection: React.FC = () => {
  const {
    data: {
      sections: { education },
    },
  } = useContext(ProfileContext);

  return (
    <SectionContainer>
      <ScrollAnchor id="education" />
      <SectionTitle>{education.title}</SectionTitle>

      <Card>
        <CardHeader icon={<span>🎓</span>}>Academic Background</CardHeader>
        <CardContent>
          <EducationText dangerouslySetInnerHTML={{ __html: education.info }} />
        </CardContent>
      </Card>
    </SectionContainer>
  );
};

export default EducationSection;
