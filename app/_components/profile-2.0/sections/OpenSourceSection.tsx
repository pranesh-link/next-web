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
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  border-radius: 12px;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(55, 65, 81, 0.3);
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
  gap: 8px;
  margin-bottom: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
`;

const MetaLabel = styled.span`
  font-weight: 600;
  color: #1f2937;
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
              <ProjectIcon>📦</ProjectIcon>
              <ProjectTitle>{project.title}</ProjectTitle>
            </ProjectHeader>

            <ProjectDescription dangerouslySetInnerHTML={{ __html: project.description }} />

            <ProjectMeta>
              {project.skillsUsed && (
                <MetaItem>
                  <MetaLabel>Tech Stack:</MetaLabel>
                  <span>{project.skillsUsed}</span>
                </MetaItem>
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
