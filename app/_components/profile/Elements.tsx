import styled from "styled-components";
import { ActionBtn, FlexBox, FlexBoxSection } from "../common/Elements";

const IconWrap = styled.div`
  display: flex;
  justify-content: flex-end;
  position: fixed;
  width: 100%;
  z-index: 20;
  background-color: #f0f0f0;
  padding: 20px 0;

  .hamburger-icon {
    margin-right: 10px;
    cursor: pointer;
    padding: 10px;
    animation: blinker 5s linear infinite;
    box-shadow: rgb(0 0 0 / 20%) 0 -1px 0px 1px, inset #304701 0 -1px 0px,
      #3f9c35 0 2px 12px;
    &.clicked {
      animation: none;
      box-shadow: none;
      @keyframes blinker {
        50% {
          opacity: 0.5;
          box-shadow: none;
        }
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
  transition: 0.5s ease-in-out;
  &.exited {
    visibility: hidden;
  }
  &.entered {
    background-color: rgba(0, 0, 0, 0.75);
  }
`;
const ContentSection = styled(FlexBoxSection)`
  background-color: #222222;
  flex-basis: 50%;
  .find-me {
    align-self: center;
    color: #f0f0f0;
    padding-bottom: 5px;
    padding-left: 15px;
    font-style: italic;
    font-weight: bold;
  }
  .close-button {
    cursor: pointer;
    margin: 10px;
    height: 30px;
  }
`;
const RightSection = styled.div`
  flex-basis: 50%;
`;

const MenuWrapper = styled.nav`
  overflow: hidden;
  position: fixed;
  top: 50px;
  left: 50px;
  width: 100%;
  z-index: 10;
  background-color: #222222;
  max-width: fit-content;
  border-radius: 5px;

  &.mobile {
    padding-top: 0;
    position: static;
    max-width: unset;
    height: 100%;
    > section {
      flex-direction: column;
    }
  }
  &:not(.mobile) {
    background-color: #f0f0f0;
    padding: 20px;
    border-radius: 0;
    left: 0px;
    top: 0px;
    max-width: 100%;
  }
  &.wrapper {
    ul {
      list-style-type: none;
      padding: 0;
      margin: 0;
    }
    li {
      text-align: center;
      padding: 20px 5px;
    }
    a {
      font-weight: bold;
      padding: 20px 5px;
      text-decoration: none;
      color: #fff;
      &:hover {
        color: #434242;
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
  margin-right: 20px;
  padding: 0 0 5px;
  &.is-active {
    border-bottom: 2px solid red;
    font-weight: 600;
  }
  &.home {
    display: flex;
    align-items: center;
    span {
      margin-left: 2px;
    }
  }
  &:hover {
    border-bottom: 2px solid #3498db;
    font-weight: 600;
    transform: scale(1.1);
  }
`;

const MobileMenuBtn = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  color: #fff;
  font-weight: bold;
  padding: 20px;
  width: 100%;
  text-align: left;
  &.is-active {
    background-color: #3f9c35;
  }
  &:hover {
    background: #3498db;
    opacity: 0.95;
  }
`;

const Wrapper = styled.section<{ $pwaOffset: number }>`
  &:not(.isMobile) {
    padding-top: 100px;
  }
  &:not(.export) {
    background-color: #f0f0f0;
    &.add-margin-top {
      margin-top: ${(props) => props.$pwaOffset || 0}px;
      /* animation: ease-in-m-t 2s ease-in 1;
      @keyframes ease-in-m-t {
        from {
          margin-top: 0;
        }
        to {
          margin-top: 90px;
        }
      } */
    }
    &.add-margin-bottom {
      margin-bottom: 90px;
      animation: ease-in-m-b 2s ease-in 1;
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
  min-width: 50%;
  border-color: #727878;
  opacity: 0.2;
  height: 0;
  border-top: 1px solid #eee;
  &.export {
    display: none;
  }
  @media screen and (max-width: 767px) {
    display: none;
  }
`;

const ShortDesc = styled.h3`
  text-align: center;
  color: #727878;
  font-size: 21px;
  font-weight: bold;
  margin-bottom: 20px;
  margin-top: 0;
  line-height: 3;
  font-style: italic;

  @media screen and (max-width: 767px) {
    padding-top: 75px;
    margin: 0;
  }
`;
const PageHeader = styled.h2`
  font-size: 45px;
  font-weight: 500;
  color: #22a39f;
  text-align: center;
  margin: 0;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  @media screen and (max-width: 767px) {
    font-size: 36px;
  }
`;

const CurrentJobRole = styled.h3`
  font-style: italic;
  margin-block: 0;
  color: #22a39f;
  font-size: 20px;
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
  ContactsSection,
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
  MenuWrapper,
  PageHeader,
  RightSection,
  SectionWrap,
  Separator,
  ShortDesc,
  SkillsInfoWrapper,
  Wrapper,
};
