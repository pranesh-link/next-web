import styled from "styled-components";
import { FlexBoxSection } from "@/_components/common/Elements";

/** Wrapper used to mark the last info section (e.g. min-height to fill viewport). */
export const SectionWrap = styled.div`
  &.last-info-section {
    min-height: 100vh;
  }
`;

/** Detail row (icon + text) used in profile contact details. */
export const DetailSection = styled(FlexBoxSection)<{
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

/** Small icon-styled button used to copy a contact detail to clipboard. */
export const CopyButton = styled.button`
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
