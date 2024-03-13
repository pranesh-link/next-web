import styled from "styled-components";
import { memo, useContext } from "react";
import { ISkill } from "@/_store/profile/types";
import {
  FlexBox,
  FlexBoxSection,
  Grid,
  SecHeader,
} from "@/_components/common/Elements";
import classNames from "classnames";
import { ProfileContext } from "@/_store/profile/context";
import { SECTIONS } from "@/_constants/profile";
import StarIcon from "@/_components/svg/StarIcon";
import StarUnfilledIcon from "@/_components/svg/StarUnfilledIcon";

const Skills = () => {
  const {
    isMobile,
    isExport = false,
    refs: { skillsRef: refObj },
    data: {
      sections: { skills },
    },
  } = useContext(ProfileContext);

  const SKILL_ICON_TEXT_MAP = {
    filled: {
      icon: <StarIcon />,
      text: "Star filled",
    },
    unfilled: {
      icon: <StarUnfilledIcon />,
      text: "Star unfilled",
    },
  };

  // eslint-disable-next-line react/display-name
  const SkillWithStars = memo(({ starNum }: { starNum: number }) => {
    const { filled, unfilled } = SKILL_ICON_TEXT_MAP;
    return (
      <FlexBox className="stars">
        {Array(5)
          .fill(null)
          .map((_item, index) => {
            const skillParams = index + 1 <= starNum ? filled : unfilled;
            return (
              <div key={index} className="star">
                {skillParams.icon}
              </div>
            );
          })}
      </FlexBox>
    );
  });

  const getColumnData = (skill: ISkill) => (
    <FlexBox className="skill">
      <div className="skill-label">
        <strong>{skill.label}</strong>
      </div>
      <SkillWithStars starNum={skill.star} />
    </FlexBox>
  );

  const getStarredSkillsData = () =>
    skills.info.map((skill: ISkill, index: number) => (
      <div key={index}>{getColumnData(skill)}</div>
    ));

  return (
    <section
      className="profile-section"
      id={isExport ? "" : SECTIONS.SKILLS}
      ref={isExport ? null : refObj}
    >
      <SecHeader className={classNames({ export: isExport })}>
        {skills.title}
      </SecHeader>
      <SkillsInfoWrapper
        $isMobile={isMobile}
        $justifyContent={isExport ? "normal" : "center"}
      >
        <Grid $gridTemplateColumns="1fr 1fr">{getStarredSkillsData()}</Grid>
      </SkillsInfoWrapper>
    </section>
  );
};

export default Skills;

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
