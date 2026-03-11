"use client";
import React, { useContext } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { DarkCard, DarkCardHeader, DarkCardContent } from "../shared/Card";
import { DownloadIcon } from "@/_components/svg";
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

const RevealWrapper = styled.div<{ $visible: boolean }>`
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transform: translateY(${(props) => (props.$visible ? "0" : "40px")}) scale(${(props) => (props.$visible ? 1 : 0.97)});
  filter: blur(${(props) => (props.$visible ? "0px" : "6px")});
  transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1.2s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform, filter;
`;

const AboutText = styled.div`
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-dim);

  b, strong {
    color: var(--text);
    font-weight: 600;
  }

  @media screen and (max-width: 768px) {
    font-size: 15px;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
`;

const DownloadButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  background: transparent;
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--border-strong);
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.25s ease;
  letter-spacing: 0.3px;

  svg {
    fill: var(--text-dim);
    transition: fill 0.25s ease;
  }

  &:hover {
    color: var(--text);
    border-color: rgba(59, 130, 246, 0.4);
    background: rgba(59, 130, 246, 0.06);

    svg {
      fill: var(--text);
    }
  }
`;

export const DarkAboutSection: React.FC = () => {
  const {
    data: {
      sections: { aboutMe },
    },
  } = useContext(ProfileContext);
  const { ref, isVisible } = useScrollReveal();

  return (
    <SectionContainer>
      <ScrollAnchor id="about" />
      <RevealWrapper ref={ref} $visible={isVisible}>
        <DarkCard>
          <DarkCardHeader>About Me</DarkCardHeader>
          <DarkCardContent>
            <AboutText dangerouslySetInnerHTML={{ __html: aboutMe.info }} />
            <ButtonWrapper>
              <DownloadButton
                href="/Pranesh-Resume.pdf"
                download="Pranesh_Resume.pdf"
              >
                <DownloadIcon height={16} width={16} />
                Download Profile
              </DownloadButton>
            </ButtonWrapper>
          </DarkCardContent>
        </DarkCard>
      </RevealWrapper>
    </SectionContainer>
  );
};

export default DarkAboutSection;
