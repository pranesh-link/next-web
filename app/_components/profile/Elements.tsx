import styled from "styled-components";
import { ActionBtn, FlexBox, FlexBoxSection } from "../common/Elements";

// Modern Card Components
const ModernCard = styled.div`
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
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #14b8a6, #06b6d4);
  }
  
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

const CardHeader = styled.h3`
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 20px 0;
  
  @media screen and (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 16px;
  }
`;

const CardContent = styled.div`
  color: #4b5563;
  line-height: 1.6;
  font-size: 16px;
  
  @media screen and (max-width: 768px) {
    font-size: 15px;
  }
`;

const ProfileImage = styled.div`
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

const SkillTag = styled.span`
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

const ActionButton = styled.button`
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

const IconWrap = styled.div`
  display: flex;
  justify-content: flex-end;
  position: fixed;
  width: 100%;
  z-index: 20;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  padding: 15px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  .hamburger-icon {
    margin-right: 15px;
    cursor: pointer;
    padding: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transition: all var(--transition-normal);
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
    
    &:active {
      transform: scale(0.95);
    }
    
    &.clicked {
      background: rgba(102, 126, 234, 0.8);
      border-color: rgba(102, 126, 234, 1);
      
      svg {
        color: white;
      }
    }
  }

  @media screen and (min-width: 768px) {
    display: none;
  }
`;
const Menu = styled.div`
  display: flex;
  position: fixed;
  flex-direction: row-reverse;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 100011;
  transition: all 0.3s ease-in-out;
  
  &.exited {
    visibility: hidden;
  }
  
  &.entered {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
  }
`;

const ContentSection = styled(FlexBoxSection)`
  background: linear-gradient(135deg, rgba(34, 34, 34, 0.95) 0%, rgba(68, 68, 68, 0.95) 100%);
  backdrop-filter: blur(20px);
  flex-basis: 280px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.3);
  
  .find-me {
    align-self: center;
    color: rgba(255, 255, 255, 0.9);
    padding: 16px 20px;
    font-style: italic;
    font-weight: 600;
    text-align: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 16px;
    background: rgba(102, 126, 234, 0.1);
  }
  
  .close-button {
    cursor: pointer;
    margin: 15px;
    height: 32px;
    width: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-normal);
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }
    
    svg {
      color: rgba(255, 255, 255, 0.9);
    }
  }
`;
const RightSection = styled.div`
  flex-basis: calc(100% - 280px);
  background: transparent;
`;

const MenuWrapper = styled.nav`
  overflow: hidden;
  position: fixed;
  width: 100%;
  z-index: 10;
  transition: all var(--transition-normal);

  &.mobile {
    padding-top: 0;
    position: static;
    max-width: unset;
    height: 100%;
    background: rgba(34, 34, 34, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 0;
    opacity: 1;
    transform: none;
    animation: none;
    
    > section {
      flex-direction: column;
    }
  }
  
  &:not(.mobile) {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(30px) saturate(130%);
    padding: 10px 24px;
    border-radius: 100px;
    position: fixed;
    left: 50%;
    top: 16px;
    transform: translateX(-50%);
    max-width: max-content;
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 
                0 2px 8px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
    
    /* Initial load animation */
    opacity: 0;
    animation: navSlideDown 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s forwards;
    
    @keyframes navSlideDown {
      from {
        opacity: 0;
        top: -50px;
      }
      to {
        opacity: 1;
        top: 16px;
      }
    }
    
    /* Enhanced transparency on scroll */
    &.scrolled {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(40px) saturate(160%);
      border-color: rgba(255, 255, 255, 0.18);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15),
                  0 4px 12px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(255, 255, 255, 0.2);
      padding: 8px 20px;
    }
    
    &:hover {
      background: rgba(255, 255, 255, 0.14);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.18),
                  0 6px 16px rgba(0, 0, 0, 0.12),
                  inset 0 1px 0 rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.28);
      backdrop-filter: blur(35px) saturate(150%);
    }
  }
  
  &.wrapper {
    ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      
      @media screen and (max-width: 767px) {
        flex-direction: column;
      }
    }
    
    li {
      text-align: center;
      padding: 8px 0;
      
      @media screen and (max-width: 767px) {
        width: 100%;
        padding: 20px 5px;
      }
    }
    
    a {
      font-weight: 600;
      padding: 12px 20px;
      text-decoration: none;
      color: rgba(255, 255, 255, 0.9);
      border-radius: 25px;
      transition: all var(--transition-normal);
      display: inline-block;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      
      &:hover {
        color: var(--color-white);
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      
      @media screen and (max-width: 767px) {
        color: #fff;
        padding: 20px 5px;
        width: 100%;
        border-radius: 0;
        
        &:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          transform: none;
        }
      }
    }
  }

  @media only screen and (max-width: 767px) {
    border-radius: 0px;
    &:not(.mobile) {
      display: none;
      right: 0;
    }
  }
`;

const MenuButton = styled(ActionBtn)`
  margin-right: 8px;
  padding: 8px 18px;
  border-radius: 24px;
  background: transparent;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  position: relative;
  font-size: 14px;
  white-space: nowrap;
  
  &.is-active {
    background: rgba(255, 255, 255, 0.22);
    color: var(--color-white);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(12px);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  &.home {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-right: 16px;
    padding-right: 16px;
    border-right: 1px solid rgba(255, 255, 255, 0.15);
    
    .back-arrow {
      transition: transform 0.3s ease;
    }
  }
  
  &:hover:not(.is-active) {
    background: rgba(255, 255, 255, 0.15);
    color: var(--color-white);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.2);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    
    &.home .back-arrow {
      transform: translateX(-2px);
    }
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:last-child {
    margin-right: 0;
  }
  
  @media screen and (max-width: 1024px) {
    padding: 7px 14px;
    font-size: 13px;
    margin-right: 6px;
  }
  
  @media screen and (max-width: 767px) {
    padding: 6px 12px;
    font-size: 12px;
    margin-right: 4px;
  }
`;

const MobileMenuBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  padding: 16px 24px;
  width: 100%;
  text-align: left;
  transition: all var(--transition-normal);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transition: width var(--transition-normal);
  }
  
  &.is-active {
    background: rgba(102, 126, 234, 0.2);
    color: #ffffff;
    
    &::before {
      width: 4px;
    }
  }
  
  &:hover:not(.is-active) {
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    transform: translateX(8px);
  }
  
  &:active {
    transform: translateX(4px);
  }
`;

const Wrapper = styled.section<{ $pwaOffset: number }>`
  &:not(.isMobile) {
    padding-top: 100px;
  }
  &:not(.export) {
    background: transparent;
    min-height: 100vh;
    position: relative;
    
    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #1e3a8a 0%, #0f766e 50%, #134e4a 100%);
      z-index: -2;
    }
    
    &::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
      z-index: -1;
    }
    
    &.add-margin-top {
      margin-top: ${(props) => props.$pwaOffset || 0}px;
      animation: ease-in-m-t 0.6s ease-out forwards;
      @keyframes ease-in-m-t {
        from {
          margin-top: 0;
          opacity: 0;
        }
        to {
          margin-top: ${(props) => props.$pwaOffset || 0}px;
          opacity: 1;
        }
      }
    }
    &.add-margin-bottom {
      margin-bottom: 90px;
      animation: ease-in-m-b 0.6s ease-out forwards;
      @keyframes ease-in-m-b {
        from {
          margin-bottom: 0;
        }
        to {
          margin-bottom: 90px;
        }
      }
    }
  }

  .header-sep {
    min-width: 100px;
    opacity: 0.6;
    height: 0;
    border-top: 5px solid #22a39f;
    margin: 0 10px;
    &.export {
      display: none;
    }
    @media screen and (max-width: 767px) {
      display: none;
    }
  }
`;

const Separator = styled.hr`
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

const ShortDesc = styled.h3`
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

const PageHeader = styled.h2`
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

const CurrentJobRole = styled.h3`
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

const SectionWrap = styled.div`
  &.last-info-section {
    min-height: 100vh;
  }
`;

const DetailSection = styled(FlexBoxSection)<{
  $isMobile: boolean;
}>`
  cursor: pointer;
  line-height: 1.5;
  .detail-icon {
    margin: ${(props) => (props.$isMobile ? "0" : "10px 0")};
    &.export {
      min-width: 0;
      width: 25px;
      margin-right: 10px;
    }
  }
  .mobile-detail {
    margin-bottom: 7px;
  }
  .detail-info {
    padding: 7px 0;
  }
  .detail-info-text {
    cursor: auto;
    flex-basis: 80%;
    margin-right: 5px;
  }
`;

const CopyButton = styled.button`
  border: none;
  color: #f0f0f0;
  cursor: pointer;
  outline: none;
  border-radius: 15px;
  padding: 2px;
  font-size: 10px;
  margin-left: 10px;
  max-width: 50px;
  &.mobile {
    display: inline-block;
    img {
      width: 15px;
      height: 15px;
    }
  }
  &.copied {
    svg {
      animation: blinker 1s linear infinite;
    }
  }
`;

const ContactsSection = styled(FlexBoxSection)`
  &.links {
    padding: 15px 0 5px;
    background-color: #222222;
    position: fixed;
    bottom: 0;
    width: 100%;
    margin-bottom: 0;
    z-index: 2;
    &.export {
      position: static;
      background-color: transparent;
      @media screen and (max-width: 767px) {
        display: flex;
        position: static;
        padding: 20px 0;
        background-color: transparent;
      }
      .link {
        padding-right: 15px;
      }
    }

    .link {
      @media screen and (max-width: 767px) {
        margin-bottom: 0;
      }
      a {
        padding: 10px 15px;
        text-decoration: none;
        border-radius: 20px;
        background-color: #0c77b9;
        &:hover {
          background-color: #3f9c35;
        }
      }
      img {
        height: 25px;
        &.Github {
          @media screen and (max-width: 767px) {
            height: 28px;
          }
        }
      }
      a,
      span {
        color: #f0f0f0;
      }
      .link-separator {
        &:last-child {
          display: none;
        }
      }
    }
  }
  .hide-profile-url {
    display: none;
  }
  .link-wrapper {
    &:not(:last-child) {
      padding-right: 50px;
    }
  }
  .developed-using {
    margin-top: 5px;
    color: #f0f0f0;
    font-weight: bold;
    font-size: 13px;
    font-style: italic;
    letter-spacing: 0.5px;
    a {
      margin-left: 3px;
      color: #3498db;
      &:visited {
        color: #3498db;
      }
    }
  }

  @media screen and (max-width: 767px) {
    .link-wrapper {
      padding-right: 0;
    }
  }
`;

const InterestedInProfile = styled(FlexBox)<{
  $isMobile: boolean;
  $disabled?: boolean;
}>`
  margin: ${(props) => (props.$isMobile ? "10px 0 0 0" : "10px 0 0 0px")};
  min-height: ${(props) => (props.$disabled ? "0px" : "50px")};
  font-weight: bold;
  &.downloaded-profile {
    margin-left: ${(props) => (props.$isMobile ? "0" : "5px")};
  }

  .download {
    min-width: 100px;
    margin-right: 5px;
    border-radius: 5px;
    cursor: pointer;
    &:hover {
      box-shadow: transparent 0px -1px 0px 0px,
        rgba(240, 240, 240, 0.3) 0px -1px 0px inset,
        rgb(63, 156, 53) 0px 2px 12px;
    }
  }

  .download-text {
    overflow: hidden;
    white-space: nowrap;
    width: 0;
    animation: typing;
    animation-duration: 3s;
    animation-timing-function: steps(30, end);
    animation-fill-mode: forwards;
  }

  @keyframes typing {
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  }
  .downloading-text {
    margin-left: 5px;
    .progress-animation {
      position: relative;
      width: 7px;
      height: 7px;
      border-radius: 5px;
      background-color: #3f9c35;
      color: #3f9c35;
      animation: flashing 1s infinite linear alternate;
      animation-delay: 0.5s;
      margin: 5px 0 0 20px;
      &::before,
      &::after {
        content: "";
        display: inline-block;
        position: absolute;
        top: 0;
      }
      &::before {
        left: -15px;
        width: 7px;
        height: 7px;
        border-radius: 5px;
        background-color: #3f9c35;
        color: #3f9c35;
        animation: flashing 1s infinite alternate;
        animation-delay: 0s;
      }
      &::after {
        left: 15px;
        width: 7px;
        height: 7px;
        border-radius: 5px;
        background-color: #3f9c35;
        color: #3f9c35;
        animation: flashing 1s infinite alternate;
        animation-delay: 1s;
      }

      @keyframes flashing {
        0% {
          background-color: #3f9c35;
        }
        50%,
        100% {
          background-color: rgba(152, 128, 255, 0.2);
        }
      }
    }
  }
`;

const DownloadingFileMessage = styled.div`
  padding: 15px;
  border-radius: 5px;
  background: #f0f0f0;
  margin: 0 auto;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  max-width: fit-content;

  @media only screen and (max-width: 767px) {
    &.offline {
      border-radius: 5px;
    }
  }
`;

const SkillsInfoWrapper = styled(FlexBoxSection)<{
  $isMobile: boolean;
}>`
  .skill {
    padding-bottom: 10px;
    .skill-label {
      flex-basis: ${(props) => {
        let flexBasis = "50%";
        flexBasis = props.$isMobile ? "40%" : flexBasis;
        return flexBasis;
      }};
      padding-right: 10px;
      ${(props) => props.$isMobile && "font-size: 13px"}
    }
    .stars {
      margin-right: 10px;
    }

    .star {
      height: ${(props) => (props.$isMobile ? "15px" : "20px")};
      width: ${(props) => (props.$isMobile ? "15px" : "20px")};
    }
  }

  @media screen and (max-width: 767px) {
    justify-content: normal;
  }
`;

export {
  ActionButton, CardContent, CardHeader, ContactsSection,
  ContentSection,
  CopyButton,
  CurrentJobRole,
  DetailSection,
  DownloadingFileMessage,
  IconWrap,
  InterestedInProfile,
  Menu,
  MobileMenuBtn as MenuBtn,
  MenuButton,
  MenuWrapper, ModernCard, PageHeader, ProfileImage, RightSection,
  SectionWrap,
  Separator,
  ShortDesc,
  SkillsInfoWrapper, SkillTag, Wrapper
};

