"use client";
import React, { useEffect, useCallback } from "react";
import styled from "styled-components";

interface DarkProjectModalProps {
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
  background: rgba(0, 0, 0, 0.8);
  display: ${(props) => (props.$isOpen ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.25s ease;
  box-sizing: border-box;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`;

const ModalTitle = styled.h3`
  font-size: 22px;
  font-weight: 700;
  color: #e5e5e5;
  margin: 0;
`;

const CloseButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #a1a1aa;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e5e5e5;
  }
`;

const ModalBody = styled.div`
  padding: 28px;
  color: #a1a1aa;
  font-size: 15px;
  line-height: 1.7;

  p { margin: 0 0 12px 0; }
  ul, ol { margin: 8px 0; padding-left: 24px; }
  li { margin: 4px 0; }
  strong { color: #e5e5e5; font-weight: 600; }
`;

const TechSection = styled.div`
  padding: 0 28px 28px;
`;

const TechLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 10px;
`;

const TechTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TechTag = styled.span`
  padding: 5px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 16px;
  color: #60a5fa;
  font-size: 12px;
  font-weight: 500;
`;

export const DarkProjectModal: React.FC<DarkProjectModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!project) return null;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{project.title}</ModalTitle>
          <CloseButton onClick={onClose} aria-label="Close modal">
            ✕
          </CloseButton>
        </ModalHeader>
        <ModalBody dangerouslySetInnerHTML={{ __html: project.description }} />
        {project.softwareTech && (
          <TechSection>
            <TechLabel>Technologies</TechLabel>
            <TechTags>
              {project.softwareTech.split(",").map((tech, i) => (
                <TechTag key={i}>{tech.trim()}</TechTag>
              ))}
            </TechTags>
          </TechSection>
        )}
      </ModalContent>
    </ModalOverlay>
  );
};
