"use client";
import React, { useContext } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { Card } from "../shared/Card";
import Button from "../shared/Button";

/**
 * OpenSourceSection Component
 * Displays open source projects and contributions
 * Design choice: Grid layout with interactive cards
 */

const SectionContainer = styled.section`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 20px 150px;
  box-sizing: border-box;
  position: relative;

  @media screen and (max-width: 768px) {
    padding: 20px 20px 130px;
  }

  @media screen and (max-width: 480px) {
    padding: 20px 16px 120px;
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
  background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
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

const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;

  @media screen and (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media screen and (max-width: 480px) {
    gap: 12px;
  }
`;

const ProjectCard = styled(Card)`
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
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  letter-spacing: -0.5px;
`;

const ProjectTitle = styled.h3`
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  flex: 1;

  @media screen and (max-width: 768px) {
    font-size: 20px;
  }
`;

const ProjectDescription = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: #4b5563;
  margin: 0 0 16px 0;
  flex: 1;
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

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`;

const ProjectMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(99, 102, 241, 0.1);
`;

const TechTagsWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TechPill = styled.span`
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #3730a3;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(99, 102, 241, 0.15);
  white-space: nowrap;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.12);
  }

  @media screen and (max-width: 768px) {
    font-size: 11px;
    padding: 4px 10px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: auto;

  @media screen and (max-width: 480px) {
    flex-direction: column;
  }
`;

export const OpenSourceSection: React.FC = () => {
  const {
    data: {
      sections: { openSourceProjects },
    },
  } = useContext(ProfileContext);

  const handleOpenLink = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <SectionContainer>
      <ScrollAnchor id="open-source" />
      <SectionTitle>{openSourceProjects.title}</SectionTitle>

      <ProjectsGrid>
        {openSourceProjects.info.map((project, index) => (
          <ProjectCard key={index} hoverable>
            <ProjectHeader>
              <ProjectIcon>
                {project.title
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </ProjectIcon>
              <ProjectTitle>{project.title}</ProjectTitle>
            </ProjectHeader>

            <ProjectDescription dangerouslySetInnerHTML={{ __html: project.description }} />

            <ProjectMeta>
              {project.skillsUsed && (
                <TechTagsWrap>
                  {project.skillsUsed.split(',').map((tech: string, tIndex: number) => (
                    <TechPill key={tIndex}>{tech.trim()}</TechPill>
                  ))}
                </TechTagsWrap>
              )}
            </ProjectMeta>

            <ButtonGroup>
              <Button
                variant="primary"
                size="small"
                fullWidth
                onClick={() => handleOpenLink(project.github)}
              >
                View on GitHub
              </Button>
              {project.npm && (
                <Button
                  variant="outline"
                  size="small"
                  fullWidth
                  onClick={() => handleOpenLink(project.npm!)}
                >
                  NPM Package
                </Button>
              )}
            </ButtonGroup>
          </ProjectCard>
        ))}
      </ProjectsGrid>
    </SectionContainer>
  );
};

export default OpenSourceSection;
