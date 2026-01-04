"use client";
import React from "react";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ProjectTitle,
  ModalBody,
  SectionLabel,
  ProjectDescription,
  TechStack,
  TechTag,
} from "./ProjectModalElements";

/**
 * ProjectModal Component
 * Modal to display detailed project information
 */

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    title: string;
    description: string;
    softwareTech?: string;
  } | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!project) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <ModalHeader>
          <CloseButton onClick={onClose}>×</CloseButton>
          <ProjectTitle>{project.title}</ProjectTitle>
        </ModalHeader>

        <ModalBody>
          <SectionLabel>Project Details</SectionLabel>
          <ProjectDescription
            dangerouslySetInnerHTML={{ __html: project.description }}
          />

          {project.softwareTech && (
            <>
              <SectionLabel>Technologies Used</SectionLabel>
              <TechStack>
                {project.softwareTech.split(",").map((tech, index) => (
                  <TechTag key={index}>{tech.trim()}</TechTag>
                ))}
              </TechStack>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default ProjectModal;
