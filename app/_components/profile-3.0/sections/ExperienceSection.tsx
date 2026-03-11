"use client";
import React, { useContext, useState } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { DarkCard } from "../shared/Card";
import { DarkProjectModal } from "../shared/ProjectModal";
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

const Timeline = styled.div`
  position: relative;
  padding-left: 32px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(
      180deg,
      #3b82f6 0%,
      #22d3ee 50%,
      rgba(34, 211, 238, 0.2) 100%
    );
    border-radius: 1px;
  }

  @media screen and (max-width: 768px) {
    padding-left: 24px;
  }

  @media screen and (max-width: 480px) {
    padding-left: 16px;
  }
`;

const TimelineItem = styled.div<{ $visible: boolean }>`
  position: relative;
  margin-bottom: 24px;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  transform: translateX(${(props) => (props.$visible ? 0 : "-20px")});
  transition: all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);

  &::before {
    content: "";
    position: absolute;
    left: -39px;
    top: 28px;
    width: 12px;
    height: 12px;
    background: #0a0a0a;
    border: 2px solid #3b82f6;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  @media screen and (max-width: 768px) {
    &::before {
      left: -30px;
      width: 10px;
      height: 10px;
    }
  }

  @media screen and (max-width: 480px) {
    &::before {
      left: -22px;
      width: 8px;
      height: 8px;
    }
  }
`;

const ExperienceCard = styled(DarkCard)`
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
  font-size: 20px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0 0 4px 0;

  @media screen and (max-width: 768px) {
    font-size: 18px;
  }
`;

const Designation = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: #a1a1aa;
  margin: 0;

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`;

const Duration = styled.div`
  font-size: 13px;
  color: #71717a;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 6px 12px;
  border-radius: 6px;
  white-space: nowrap;
`;

const Responsibilities = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: #a1a1aa;
  margin: 0 0 20px 0;

  p { margin: 0 0 12px 0; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }
  strong { color: #e5e5e5; font-weight: 600; }

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`;

const ProjectsTitle = styled.h4`
  font-size: 13px;
  font-weight: 600;
  color: #71717a;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ProjectBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ProjectBadge = styled.button`
  background: rgba(59, 130, 246, 0.08);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;

  &:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
    color: #a5b4fc;
    transform: translateY(-1px);
  }

  @media screen and (max-width: 768px) {
    font-size: 12px;
    padding: 6px 12px;
  }
`;

export const DarkExperienceSection: React.FC = () => {
  const {
    data: {
      sections: { experiences },
    },
  } = useContext(ProfileContext);
  const { ref, isVisible } = useScrollReveal({ threshold: 0.05 });

  const [selectedProject, setSelectedProject] = useState<{
    title: string;
    description: string;
    softwareTech?: string;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectClick = (project: {
    title: string;
    description: string;
    softwareTech?: string;
  }) => {
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

      <Timeline ref={ref}>
        {experiences.info.map((exp, index) => (
          <TimelineItem key={index} $visible={isVisible}>
            <ExperienceCard>
              <CompanyHeader>
                <CompanyInfo>
                  <CompanyName>{exp.name}</CompanyName>
                  <Designation>{exp.designation}</Designation>
                </CompanyInfo>
                <Duration>
                  {exp.from} - {exp.to || "Present"}
                </Duration>
              </CompanyHeader>

              <Responsibilities
                dangerouslySetInnerHTML={{ __html: exp.responsibilities }}
              />

              {exp.projects && exp.projects.length > 0 && (
                <div>
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
                </div>
              )}
            </ExperienceCard>
          </TimelineItem>
        ))}
      </Timeline>

      <DarkProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
      />
    </SectionContainer>
  );
};

export default DarkExperienceSection;
