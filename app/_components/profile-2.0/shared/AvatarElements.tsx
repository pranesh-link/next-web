import styled from "styled-components";

export const AvatarWrapper = styled.div<{ $size: string }>`
  position: relative;
  width: ${(props) => {
    switch (props.$size) {
      case "small":
        return "80px";
      case "large":
        return "220px";
      default:
        return "160px";
    }
  }};
  height: ${(props) => {
    switch (props.$size) {
      case "small":
        return "80px";
      case "large":
        return "220px";
      default:
        return "160px";
    }
  }};
  margin: 0 auto;
  
  @media screen and (max-width: 768px) {
    width: ${(props) => {
      switch (props.$size) {
        case "small":
          return "60px";
        case "large":
          return "140px";
        default:
          return "120px";
      }
    }};
    height: ${(props) => {
      switch (props.$size) {
        case "small":
          return "60px";
        case "large":
          return "140px";
        default:
          return "120px";
      }
    }};
  }
`;

export const AvatarContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Gradient border effect */
  &::before {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    padding: 3px;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #818cf8 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    z-index: -1;
    opacity: 0.8;
    transition: opacity 0.4s ease;
  }
  
  &:hover::before {
    opacity: 1;
    animation: rotate 3s linear infinite;
  }
  
  &:hover {
    transform: scale(1.08) rotate(2deg);
    box-shadow: 0 20px 60px rgba(99, 102, 241, 0.35);
  }
  
  @keyframes rotate {
    0% {
      filter: hue-rotate(0deg);
    }
    100% {
      filter: hue-rotate(360deg);
    }
  }
`;

export const StyledImage = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;
