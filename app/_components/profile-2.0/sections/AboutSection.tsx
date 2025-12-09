"use client";
import React, { useContext } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { Card, CardHeader, CardContent } from "../shared/Card";
import ContactInfo from "../shared/ContactInfo";

/**
 * AboutSection Component
 * Displays about me information and contact details
 * Design choice: Card-based layout for clear content separation
 */

const SectionContainer = styled.section`
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 32px;

  @media screen and (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const AboutText = styled.div`
  font-size: 18px;
  line-height: 1.8;
  color: #4b5563;
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  
  b, strong {
    color: #374151;
    font-weight: 700;
  }

  @media screen and (max-width: 768px) {
    font-size: 16px;
    line-height: 1.7;
  }
`;

export const AboutSection: React.FC = () => {
  const {
    data: {
      sections: { aboutMe, details },
    },
  } = useContext(ProfileContext);

  return (
    <SectionContainer>
      <ScrollAnchor id="about" />

      <Card>
        <CardHeader>About Me</CardHeader>
        <CardContent>
          <AboutText dangerouslySetInnerHTML={{ __html: aboutMe.info }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Contact Details</CardHeader>
        <CardContent>
          <Grid>
            {details.info.map((detail, index) => (
              <ContactInfo
                key={index}
                icon={<span>📧</span>}
                label={detail.label}
                value={detail.info}
                canCopy={detail.canCopy}
              />
            ))}
          </Grid>
        </CardContent>
      </Card>
    </SectionContainer>
  );
};

export default AboutSection;
