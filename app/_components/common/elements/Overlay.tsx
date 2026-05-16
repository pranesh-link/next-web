"use client";
import styled from "styled-components";

/** Spinning loader image; size adjusts via the `isMobile` prop. */
export const LoaderImg = styled.img<{ isMobile: boolean }>`
  width: ${(props) => (props.isMobile ? "75px" : "100px")};
  position: absolute;
  top: 40%;
  left: ${(props) => (props.isMobile ? "40%" : "45%")};
  animation: loader-spin infinite 1s linear;

  @keyframes loader-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

/** Fixed positioned overlay; size and color controlled by transient props. */
export const Overlay = styled.div<{
  $opacity: number;
  $top?: number;
  $bottom?: string;
  $height?: number;
  $background?: string;
}>`
  position: fixed;
  ${(props) => props.$top && `top: ${props.$top}px`};
  ${(props) => props.$bottom && `bottom: ${props.$bottom}px`};
  height: ${(props) => props.$height || 0}px;
  background: ${(props) => props.$background || "#fff"};
  width: 100%;
  opacity: ${(props) => props.$opacity};
`;

/** Decorative banner shown at the top/bottom of a modal. */
export const ModalBanner = styled.div`
  height: 5px;
  background: #3f9c35;
  position: fixed;
  width: 100%;
  &.header {
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
  }
  &.footer {
    border-bottom-left-radius: 5px;
    border-bottom-right-radius: 5px;
    bottom: 0;
  }
`;

/** Modal content wrapper that handles scroll behavior across breakpoints. */
export const ModalContentWrap = styled(FlexBox)`
  background: #f0f0f0;
  position: relative;
  border-radius: 5px;

  &.contact-modal {
    .close {
      margin-bottom: 0;
    }
  }

  .close {
    align-self: self-end;
    margin-right: 20px;
    margin-bottom: 20px;
    padding: 7px 15px;
    background: #3498db;
    border-radius: 20px;
    color: #f0f0f0;
    &:hover {
      background: #ee4b2b;
    }
    @media only screen and (max-width: 992px) {
      align-self: center;
      margin-right: 0;
    }
  }

  @media only screen and (max-width: 374px) and (orientation: portrait) {
    max-height: 99vh;
    overflow-y: scroll;
  }

  @media only screen and (min-width: 375px) and (max-width: 992px) and (orientation: portrait) {
    max-height: 90vh;
    overflow-y: scroll;
  }

  @media only screen and (max-width: 992px) and (orientation: landscape) {
    max-height: 80vh;
    overflow-y: scroll;
  }
`;
