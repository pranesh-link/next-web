"use client";
import styled, { keyframes } from "styled-components";

const fillBar = keyframes`
  from { width: 0%; }
  to { width: var(--fill-width); }
`;

const Badge = styled.div<{ $delay?: string; $visible?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text-dim);
  font-size: 14px;
  font-weight: 500;
  transition: border-color 0.3s ease, color 0.3s ease, background 0.3s ease,
    transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    border-color: rgba(59, 130, 246, 0.4);
    color: var(--text);
    background: rgba(59, 130, 246, 0.08);
    transform: translateY(-2px);
  }

  @media screen and (max-width: 768px) {
    font-size: 13px;
    padding: 8px 12px;
  }
`;

const Label = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ProgressTrack = styled.div`
  width: 100%;
  height: 3px;
  background: var(--surface-hover);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div<{
  $width: number;
  $delay?: string;
  $visible?: boolean;
}>`
  --fill-width: ${(props) => props.$width}%;
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #22c55e, #4ade80);
  width: ${(props) => (props.$visible ? "var(--fill-width)" : "0%")};
  animation: ${(props) => (props.$visible ? fillBar : "none")} 1s
    cubic-bezier(0.16, 1, 0.3, 1) ${(props) => props.$delay || "0s"} both;
`;

interface DarkSkillBadgeProps {
  label: string;
  delay?: string;
  star?: number;
  visible?: boolean;
}

const DarkSkillBadge: React.FC<DarkSkillBadgeProps> = ({
  label,
  delay,
  star = 3,
  visible = false,
}) => {
  const fillPercent = (star / 5) * 100;

  return (
    <Badge $delay={delay} $visible={visible}>
      <Label>{label}</Label>
      <ProgressTrack>
        <ProgressFill
          $width={fillPercent}
          $delay={delay}
          $visible={visible}
        />
      </ProgressTrack>
    </Badge>
  );
};

export default DarkSkillBadge;
