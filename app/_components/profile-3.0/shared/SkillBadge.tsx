"use client";
import styled from "styled-components";

const Badge = styled.span<{ $delay?: string }>`
  display: inline-block;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #a1a1aa;
  font-size: 14px;
  font-weight: 500;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.4);
    color: #e5e5e5;
    background: rgba(59, 130, 246, 0.08);
  }

  @media screen and (max-width: 768px) {
    font-size: 13px;
    padding: 6px 12px;
  }
`;

interface DarkSkillBadgeProps {
  label: string;
  delay?: string;
}

const DarkSkillBadge: React.FC<DarkSkillBadgeProps> = ({ label, delay }) => (
  <Badge $delay={delay}>{label}</Badge>
);

export default DarkSkillBadge;
