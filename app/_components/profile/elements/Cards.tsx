import styled from "styled-components";

/** Translucent card with hover lift used across the modern profile UI. */
export const ModernCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 32px;
  margin: 16px 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all var(--transition-normal);
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
  }
  
  @media screen and (max-width: 768px) {
    padding: 24px;
    margin: 12px 0;
    border-radius: 16px;
  }
`;

/** Heading styled for use inside `ModernCard`. */
export const CardHeader = styled.h3`
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 20px 0;
  
  @media screen and (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 16px;
  }
`;

/** Body text container styled for use inside `ModernCard`. */
export const CardContent = styled.div`
  color: #4b5563;
  line-height: 1.6;
  font-size: 16px;
  
  @media screen and (max-width: 768px) {
    font-size: 15px;
  }
`;

/** Circular avatar/profile image with hover effect. */
export const ProfileImage = styled.div`
  width: 200px;
  height: 200px;
  margin: 0 auto 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all var(--transition-normal);
  
  &:hover {
    transform: scale(1.05);
    border-color: rgba(255, 255, 255, 0.5);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media screen and (max-width: 768px) {
    width: 150px;
    height: 150px;
  }
`;

/** Pill-styled tag rendered for individual skills/tech keywords. */
export const SkillTag = styled.span`
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin: 4px 8px 4px 0;
  transition: all var(--transition-normal);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

/** Gradient call-to-action button used in modern profile sections. */
export const ActionButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all var(--transition-normal);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  }
  
  &:active {
    transform: translateY(0);
  }
`;
