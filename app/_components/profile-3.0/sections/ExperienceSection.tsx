"use client";
import React, { useContext, useState } from "react";
import { ProfileContext } from "@/_store/profile/page/context";
import { DarkProjectModal } from "../shared/ProjectModal";
import { useScrollReveal } from "@/_hooks/use-scroll-reveal";
import {
  CompanyHeader,
  CompanyInfo,
  CompanyName,
  Designation,
  Duration,
  ExpandArrow,
  ExpandToggle,
  ExperienceCard,
  ProjectBadge,
  ProjectBadges,
  ProjectsTitle,
  Responsibilities,
  ScrollAnchor,
  SectionContainer,
  SectionTitle,
  Timeline,
  TimelineItem,
} from "./ExperienceSection.styled";

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
 * Dark-themed professional experience timeline used in profile-3.0.
 *
 * @returns The experience section element with expandable cards and
 *   scroll-reveal animations.
 */
export const DarkExperienceSection: React.FC = () => {
  const {
    data: {
      sections: { experiences },
    },
  } = useContext(ProfileContext);
  const { ref, isVisible } = useScrollReveal({ threshold: 0.05 });

  const [selectedProject, setSelectedProject] = useState<ProjectEntry | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const toggleExpand = (index: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

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

      <Timeline ref={ref}>
        {experiences.info.map((exp, index) => (
          <TimelineItem key={index} $visible={isVisible} $index={index}>
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
                $expanded={expandedCards.has(index)}
                dangerouslySetInnerHTML={{ __html: exp.responsibilities }}
              />
              <ExpandToggle onClick={() => toggleExpand(index)}>
                {expandedCards.has(index) ? "Show less" : "Show more"}
                <ExpandArrow $expanded={expandedCards.has(index)}>▼</ExpandArrow>
              </ExpandToggle>

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
