import styled from "styled-components";
import { FlexBoxSection } from "@/_components/common/Elements";

/** Wrapper for skills list rows; adapts label/star sizing to `$isMobile`. */
export const SkillsInfoWrapper = styled(FlexBoxSection)<{
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
