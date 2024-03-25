import { FlexBox } from "@/_components/common/Elements";
import styled from "styled-components";

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

export { DownloadingFileMessage, InterestedInProfile };
