"use client";
import React from "react";
import styled from "styled-components";

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

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: ${(props) => (props.$isOpen ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
  box-sizing: border-box;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;

  @keyframes slideUp {
    from {
      transform: translateY(30px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media screen and (max-width: 768px) {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 16px;
  }
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  padding: 24px;
  border-radius: 20px 20px 0 0;
  position: sticky;
  top: 0;
  z-index: 1;
  box-sizing: border-box;

  @media screen and (max-width: 768px) {
    padding: 20px;
    border-radius: 16px 16px 0 0;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: rotate(90deg);
  }

  @media screen and (max-width: 768px) {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
`;

const ProjectTitle = styled.h3`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  padding-right: 40px;

  @media screen and (max-width: 768px) {
    font-size: 20px;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
  box-sizing: border-box;

  @media screen and (max-width: 768px) {
    padding: 20px;
  }
`;

const SectionLabel = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
`;

const ProjectDescription = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: #4b5563;
  margin-bottom: 24px;
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
  }

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`;

const TechStack = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TechTag = styled.span`
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #1e40af;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #bfdbfe;

  @media screen and (max-width: 768px) {
    font-size: 12px;
    padding: 5px 10px;
  }
`;

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
