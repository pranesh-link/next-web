import styled from "styled-components";

/** Animated horizontal divider used between profile sections. */
export const Separator = styled.hr`
  min-width: 60%;
  border: none;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  margin: 30px auto;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.8s forwards;
  
  &.export {
    display: none;
  }
  
  @media screen and (max-width: 767px) {
    min-width: 80%;
    margin: 20px auto;
  }
`;

/** Italic short description shown beneath the page header. */
export const ShortDesc = styled.h3`
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 24px;
  font-weight: 300;
  margin-bottom: 20px;
  margin-top: 0;
  line-height: 1.5;
  font-style: italic;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.2s forwards;

  @media screen and (max-width: 767px) {
    padding-top: 75px;
    margin: 0;
    font-size: 20px;
  }
`;

/** Main profile page header with gradient text and decorative side separators. */
export const PageHeader = styled.h2`
  font-size: 52px;
  font-weight: 700;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin: 20px 0;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: 2px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.4s forwards;
  
  @media screen and (max-width: 767px) {
    font-size: 36px;
    letter-spacing: 1px;
  }
  
  .header-sep {
    min-width: 120px;
    opacity: 0.8;
    height: 0;
    border-top: 3px solid rgba(255, 255, 255, 0.6);
    margin: 0 15px;
    border-radius: 2px;
    transition: all var(--transition-normal);
    
    &.export {
      display: none;
    }
    
    @media screen and (max-width: 767px) {
      display: none;
    }
  }
`;

/** Italic current job role line shown under the page header. */
export const CurrentJobRole = styled.h3`
  font-style: italic;
  margin-block: 0;
  color: rgba(255, 255, 255, 0.95);
  font-size: 22px;
  font-weight: 400;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0;
  animation: fadeInUp 0.8s ease-out 0.6s forwards;
  
  @media screen and (max-width: 767px) {
    font-size: 18px;
  }
`;
