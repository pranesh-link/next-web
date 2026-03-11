"use client";
import React, { useContext } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { DarkCard } from "../shared/Card";
import { useScrollReveal } from "@/_hooks/use-scroll-reveal";

const SectionContainer = styled.section`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 80px 24px 150px;
  box-sizing: border-box;
  position: relative;

  @media screen and (max-width: 768px) {
    padding: 60px 20px 130px;
  }

  @media screen and (max-width: 480px) {
    padding: 40px 16px 120px;
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
  color: var(--accent);
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
  transform: translateY(${(props) => (props.$visible ? "0" : "40px")}) scale(${(props) => (props.$visible ? 1 : 0.97)});
  filter: blur(${(props) => (props.$visible ? "0px" : "6px")});
  transition: opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1.2s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform, filter;
`;

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;

  @media screen and (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ProjectCard = styled(DarkCard)`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ProjectHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const ProjectIcon = styled.div`
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  color: var(--accent-light);
  letter-spacing: -0.5px;
  flex-shrink: 0;
`;

const ProjectTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
  flex: 1;

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }
`;

const ProjectDescription = styled.div`
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-dim);
  margin: 0 0 16px 0;
  flex: 1;

  p { margin: 0 0 12px 0; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }

  @media screen and (max-width: 768px) {
    font-size: 13px;
  }
`;

const TechTagsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--surface-hover);
`;

const TechPill = styled.span`
  background: rgba(59, 130, 246, 0.08);
  color: var(--accent-light);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(59, 130, 246, 0.15);
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: auto;

  @media screen and (max-width: 480px) {
    flex-direction: column;
  }
`;

const LinkButton = styled.a<{ $variant?: "primary" | "outline" }>`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.25s ease;
  text-align: center;

  ${(props) =>
    props.$variant === "outline"
      ? `
    background: transparent;
    border: 1px solid var(--border-strong);
    color: var(--text-dim);

    &:hover {
      border-color: rgba(34, 211, 238, 0.4);
      color: #22d3ee;
      background: rgba(34, 211, 238, 0.06);
    }
  `
      : `
    background: rgba(59, 130, 246, 0.12);
    border: 1px solid rgba(59, 130, 246, 0.25);
    color: #a5b4fc;

    &:hover {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.4);
      color: #c7d2fe;
    }
  `}
`;

export const DarkOpenSourceSection: React.FC = () => {
  const {
    data: {
      sections: { openSourceProjects },
    },
  } = useContext(ProfileContext);
  const { ref, isVisible } = useScrollReveal({ threshold: 0.05 });

  return (
    <SectionContainer>
      <ScrollAnchor id="open-source" />
      <SectionTitle>{openSourceProjects.title}</SectionTitle>
      <RevealWrapper ref={ref} $visible={isVisible}>
        <ProjectsGrid>
          {openSourceProjects.info.map((project, index) => (
            <ProjectCard key={index} hoverable>
              <ProjectHeader>
                <ProjectIcon>
                  {project.title
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </ProjectIcon>
                <ProjectTitle>{project.title}</ProjectTitle>
              </ProjectHeader>

              <ProjectDescription
                dangerouslySetInnerHTML={{ __html: project.description }}
              />

              {project.skillsUsed && (
                <TechTagsWrap>
                  {project.skillsUsed
                    .split(",")
                    .map((tech: string, tIndex: number) => (
                      <TechPill key={tIndex}>{tech.trim()}</TechPill>
                    ))}
                </TechTagsWrap>
              )}

              <ButtonGroup>
                <LinkButton
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </LinkButton>
                {project.npm && (
                  <LinkButton
                    $variant="outline"
                    href={project.npm}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    NPM
                  </LinkButton>
                )}
              </ButtonGroup>
            </ProjectCard>
          ))}
        </ProjectsGrid>
      </RevealWrapper>
    </SectionContainer>
  );
};

export default DarkOpenSourceSection;
