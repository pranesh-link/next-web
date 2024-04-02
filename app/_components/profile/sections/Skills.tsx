import { FlexBoxSection, Grid, SecHeader } from "@/_components/common/Elements";
import { SECTIONS } from "@/_constants/profile";
import { ProfileContext } from "@/_store/profile/context";
import { ISkill } from "@/_store/profile/types";
import classNames from "classnames";
import { useContext, useMemo } from "react";
import styled from "styled-components";
import SkillWithStars from "../SkillWithStars";

const Skills = () => {
  const {
    isMobile,
    isExport = false,
    refs: { skillsRef: refObj },
    data: {
      sections: { skills },
    },
  } = useContext(ProfileContext);

  const sortedSkillsByRating = useMemo(
    () =>
      skills.info.sort((a, b) => {
        if (a.star > b.star) {
          return -1;
        } else if (a.star < b.star) {
          return 1;
        } else {
          return 0;
        }
      }),
    [skills.info]
  );

  const getColumnData = (skill: ISkill) => (
    <Grid className="skill" $gridTemplateColumns="1.2fr 1fr">
      <div className="skill-label">
        <strong>{skill.label}</strong>
      </div>
      <SkillWithStars starNum={skill.star} />
    </Grid>
  );

  const getStarredSkillsData = () =>
    sortedSkillsByRating.map((skill: ISkill, index: number) => (
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
