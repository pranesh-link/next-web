import styled from "styled-components";
import { Card } from "../shared/Card";

export const ExperienceCard = styled(Card)`
  margin: 0;
`;

export const CompanyHeader = styled.div`
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

export const CompanyInfo = styled.div`
  flex: 1;
`;

export const CompanyName = styled.h3`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;

  @media screen and (max-width: 768px) {
    font-size: 20px;
  }
`;

export const Designation = styled.p`
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0;

  @media screen and (max-width: 768px) {
    font-size: 16px;
  }
`;

export const Duration = styled.div`
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

export const Responsibilities = styled.div`
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

export const ProjectsSection = styled.div`
  margin-top: 24px;
`;

export const ProjectsTitle = styled.h4`
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

export const ProjectBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

export const ProjectBadge = styled.button`
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
