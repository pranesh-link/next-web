"use client";
import React, { useContext, useState } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { Card } from "../shared/Card";
import { ProjectModal } from "../shared/ProjectModal";

/**
 * ExperienceSection Component
 * Displays professional experience in a timeline format
 * Design choice: Timeline layout for chronological visualization
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

const Timeline = styled.div`
  position: relative;
  padding-left: 40px;

  /* Timeline line */
  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%);
    border-radius: 2px;
  }

  @media screen and (max-width: 768px) {
    padding-left: 24px;

    &::before {
      width: 3px;
    }
  }

  @media screen and (max-width: 480px) {
    padding-left: 16px;

    &::before {
      width: 2px;
    }
  }
`;

const TimelineItem = styled.div`
  position: relative;
  margin-bottom: 32px;
  animation: fadeInLeft 0.6s ease-out both;
  animation-delay: calc(var(--index) * 0.1s);

  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  /* Timeline dot */
  &::before {
    content: "";
    position: absolute;
    left: -49px;
    top: 24px;
    width: 16px;
    height: 16px;
    background: white;
    border: 4px solid #6366f1;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  }

  @media screen and (max-width: 768px) {
    margin-bottom: 24px;

    &::before {
      left: -32px;
      width: 12px;
      height: 12px;
      border-width: 3px;
      top: 20px;
    }
  }

  @media screen and (max-width: 480px) {
    margin-bottom: 20px;

    &::before {
      left: -23px;
      width: 10px;
      height: 10px;
      border-width: 2px;
      top: 18px;
    }
  }
`;

const ExperienceCard = styled(Card)`
  margin: 0;
`;

const CompanyHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;

  @media screen and (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const CompanyInfo = styled.div`
  flex: 1;
`;

const CompanyName = styled.h3`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;

  @media screen and (max-width: 768px) {
    font-size: 20px;
  }
`;

const Designation = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }
`;

const Duration = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  background: rgba(102, 126, 234, 0.1);
  padding: 6px 12px;
  border-radius: 8px;
  white-space: nowrap;

  &::before {
    content: "📅";
  }

  @media screen and (max-width: 768px) {
    font-size: 13px;
  }
`;

const Responsibilities = styled.div`
  font-size: 16px;
  line-height: 1.7;
  color: #4b5563;
  margin: 0 0 20px 0;
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
    font-size: 15px;
  }
`;

const ProjectsSection = styled.div`
  margin-top: 24px;
`;

const ProjectsTitle = styled.h4`
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: "💼";
  }

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }
`;

const ProjectBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const ProjectBadge = styled.button`
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: "📁";
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
  }

  &:active {
    transform: translateY(0);
  }

  @media screen and (max-width: 768px) {
    font-size: 13px;
    padding: 8px 14px;
  }

  @media screen and (max-width: 480px) {
    font-size: 12px;
    padding: 7px 12px;
  }
`;

export const ExperienceSection: React.FC = () => {
  const {
    data: {
      sections: { experiences },
    },
  } = useContext(ProfileContext);

  const [selectedProject, setSelectedProject] = useState<{
    title: string;
    description: string;
    softwareTech?: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectClick = (project: { title: string; description: string; softwareTech?: string }) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProject(null), 300);
  };

  return (
    <SectionContainer>
      <ScrollAnchor id="experience" />
      <SectionTitle>{experiences.title}</SectionTitle>

      <Timeline>
        {experiences.info.map((exp, index) => (
          <TimelineItem key={index} style={{ "--index": index } as React.CSSProperties}>
            <ExperienceCard hoverable>
              <CompanyHeader>
                <CompanyInfo>
                  <CompanyName>{exp.name}</CompanyName>
                  <Designation>{exp.designation}</Designation>
                </CompanyInfo>
                <Duration>
                  {exp.from} - {exp.to || "Present"}
                </Duration>
              </CompanyHeader>

              <Responsibilities dangerouslySetInnerHTML={{ __html: exp.responsibilities }} />

              {exp.projects && exp.projects.length > 0 && (
                <ProjectsSection>
                  <ProjectsTitle>Key Projects</ProjectsTitle>
                  <ProjectBadges>
                    {exp.projects.map((project, pIndex) => (
                      <ProjectBadge
                        key={pIndex}
                        onClick={() => handleProjectClick(project)}
                      >
                        {project.title}
                      </ProjectBadge>
                    ))}
                  </ProjectBadges>
                </ProjectsSection>
              )}
            </ExperienceCard>
          </TimelineItem>
        ))}
      </Timeline>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
      />
    </SectionContainer>
  );
};

export default ExperienceSection;
