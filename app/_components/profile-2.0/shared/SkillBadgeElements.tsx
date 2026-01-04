import styled from "styled-components";

export const BadgeContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.1) 0%, rgba(31, 41, 55, 0.1) 100%);
  padding: 12px 20px;
  border-radius: 16px;
  border: 1px solid rgba(55, 65, 81, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 6px;
  box-shadow: 0 2px 8px rgba(55, 65, 81, 0.1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(55, 65, 81, 0.2);
    background: linear-gradient(135deg, rgba(55, 65, 81, 0.15) 0%, rgba(31, 41, 55, 0.15) 100%);
    border-color: rgba(55, 65, 81, 0.4);
  }

  @media screen and (max-width: 768px) {
    padding: 10px 16px;
    gap: 10px;
    margin: 4px;
  }

  @media screen and (max-width: 480px) {
    padding: 8px 14px;
    gap: 8px;
  }
`;

export const SkillLabel = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;

  @media screen and (max-width: 768px) {
    font-size: 14px;
  }
`;

export const StarsContainer = styled.div`
  display: flex;
  gap: 4px;
`;

export const Star = styled.div<{ $filled: boolean }>`
  width: 16px;
  height: 16px;
  position: relative;
  
  &::before {
    content: "★";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 18px;
    color: ${(props) => (props.$filled ? "#fbbf24" : "#e5e7eb")};
    transition: all 0.3s ease;
    text-shadow: ${(props) =>
      props.$filled ? "0 2px 4px rgba(251, 191, 36, 0.3)" : "none"};
  }

  ${BadgeContainer}:hover &::before {
    ${(props) =>
      props.$filled &&
      `
      transform: translate(-50%, -50%) scale(1.2);
      filter: brightness(1.2);
    `}
  }

  @media screen and (max-width: 768px) {
    width: 14px;
    height: 14px;
    
    &::before {
      font-size: 16px;
    }
  }
`;

export const SimpleTag = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(55, 65, 81, 0.3);
  cursor: default;

  &:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 12px rgba(55, 65, 81, 0.4);
  }

  @media screen and (max-width: 768px) {
    padding: 6px 12px;
    font-size: 13px;
    margin: 3px;
  }
`;
