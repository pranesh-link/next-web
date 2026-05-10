"use client";
import React, { useContext, useState } from "react";
import { ProfileContext } from "@/_store/profile/page/context";
import { ProjectModal } from "../shared/ProjectModal";
import {
  ScrollAnchor,
  SectionContainer,
  SectionTitle,
  Timeline,
  TimelineItem,
} from "./ExperienceSection.styled";
import {
  CompanyHeader,
  CompanyInfo,
  CompanyName,
  Designation,
  Duration,
  ExperienceCard,
  ProjectBadge,
  ProjectBadges,
  ProjectsSection,
  ProjectsTitle,
  Responsibilities,
} from "./ExperienceSection.card.styled";

/**
 * A project entry shown in the experience timeline.
 */
type ProjectEntry = {
  /** Project title used as badge label and modal heading. */
  title: string;
  /** HTML/markdown description rendered inside the modal. */
  description: string;
  /** Optional comma-separated tech stack summary. */
  softwareTech?: string;
};

/**
 * Displays professional experience in a vertical timeline layout for
 * the profile-2.0 page.
 *
 * @returns The experience section element.
 */
export const ExperienceSection: React.FC = () => {
  const {
    data: {
      sections: { experiences },
    },
  } = useContext(ProfileContext);

  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectClick = (project: ProjectEntry) => {
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
          <TimelineItem
            key={index}
            $index={index}
          >
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

              <Responsibilities
                dangerouslySetInnerHTML={{ __html: exp.responsibilities }}
              />

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
