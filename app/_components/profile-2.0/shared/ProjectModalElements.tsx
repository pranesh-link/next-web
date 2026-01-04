import styled from "styled-components";

export const ModalOverlay = styled.div<{ $isOpen: boolean }>`
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

export const ModalContent = styled.div`
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

export const ModalHeader = styled.div`
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
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

export const CloseButton = styled.button`
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

export const ProjectTitle = styled.h3`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  padding-right: 40px;

  @media screen and (max-width: 768px) {
    font-size: 20px;
  }
`;

export const ModalBody = styled.div`
  padding: 24px;
  box-sizing: border-box;

  @media screen and (max-width: 768px) {
    padding: 20px;
  }
`;

export const SectionLabel = styled.h4`
  font-size: 14px;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px 0;
`;

export const ProjectDescription = styled.div`
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

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`;

export const TechStack = styled.div`
  background: rgba(55, 65, 81, 0.05);
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid #374151;

  @media screen and (max-width: 768px) {
    padding: 12px;
  }
`;

export const TechList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

export const TechTag = styled.span`
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  color: white;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(55, 65, 81, 0.2);

  @media screen and (max-width: 768px) {
    padding: 5px 12px;
    font-size: 12px;
  }
`;
