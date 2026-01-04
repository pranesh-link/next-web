import styled from "styled-components";

export const StyledButton = styled.button<{
  $variant: string;
  $size: string;
  $fullWidth: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  outline: none;
  font-family: inherit;
  
  width: ${(props) => (props.$fullWidth ? "100%" : "auto")};
  
  /* Size variants */
  ${(props) => {
    switch (props.$size) {
      case "small":
        return `
          padding: 8px 16px;
          font-size: 14px;
          border-radius: 10px;
        `;
      case "large":
        return `
          padding: 16px 32px;
          font-size: 18px;
          border-radius: 14px;
        `;
      default:
        return `
          padding: 12px 24px;
          font-size: 16px;
        `;
    }
  }}
  
  /* Variant styles */
  ${(props) => {
    switch (props.$variant) {
      case "primary":
        return `
          background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(55, 65, 81, 0.3);
          
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(55, 65, 81, 0.4);
            background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
          }
        `;
      case "secondary":
        return `
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
          
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(240, 147, 251, 0.4);
          }
        `;
      case "outline":
        return `
          background: transparent;
          color: #374151;
          border: 2px solid #374151;
          
          &:hover:not(:disabled) {
            background: rgba(55, 65, 81, 0.1);
            border-color: #4b5563;
            color: #4b5563;
          }
        `;
      case "ghost":
        return `
          background: transparent;
          color: #374151;
          
          &:hover:not(:disabled) {
            background: rgba(55, 65, 81, 0.1);
          }
        `;
      default:
        return "";
    }
  }}
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Ripple effect */
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:active:not(:disabled)::after {
    width: 300px;
    height: 300px;
  }

  @media screen and (max-width: 768px) {
    ${(props) => {
      switch (props.$size) {
        case "small":
          return `
            padding: 6px 12px;
            font-size: 13px;
          `;
        case "large":
          return `
            padding: 14px 28px;
            font-size: 16px;
          `;
        default:
          return `
            padding: 10px 20px;
            font-size: 15px;
          `;
      }
    }}
  }
`;

export const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;
