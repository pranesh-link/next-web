import {
  FlexBox,
  SectionsWrapper,
  Version,
} from "@/_components/common/Elements";
import VersionModal from "@/_components/modal/common/VersionModal";
import { SECTION_ORDER_DISPLAY } from "@/_constants/profile";
import { ProfileContext } from "@/_store/profile/page/context";
import classNames from "classnames";
import React, { useContext, useMemo, useState } from "react";
import styled from "styled-components";
import About from "./sections/About";
import Education from "./sections/Education";
import OpenSourceProjects from "./sections/OpenSourceProjects";
import ResumeExperiences from "./sections/ResumeExperiences";
import Skills from "./sections/Skills";

interface IProfileSectionsProps {
  exportProfile?: () => void;
}

interface ISectionComponents {
  order: number;
  name: string;
  component: JSX.Element;
  display?: boolean;
}
const ProfileSections = (props: IProfileSectionsProps) => {
  const {
    isExport = false,
    isMobile,
    data: { header },
    pwaOffset,
  } = React.useContext(ProfileContext);
  const { appVersion: version } = useContext(ProfileContext);
  const [displayVersionModal, setDisplayVersionModal] = useState(false);
  const { shortDesc, name, currentJobRole } = header;
  const { ABOUTME, EDUCATION, SKILLS, EXPERIENCES, OPENSOURCEPROJECTS } =
    SECTION_ORDER_DISPLAY;
  const AboutComp = useMemo(
    () => (
      <About
        exportProfile={() => {
          if (props.exportProfile) {
            props.exportProfile();
          }
        }}
      />
    ),
    [props]
  );

  const EducationComp = useMemo(() => <Education />, []);

  const SkillsComp = useMemo(() => <Skills />, []);

  const ExperiencesComp = useMemo(() => <ResumeExperiences />, []);

  const OpenSourceProjectsComp = useMemo(() => <OpenSourceProjects />, []);

  const sectionComponents: ISectionComponents[] = useMemo(
    () => [
      {
        order: ABOUTME.order,
        name: "about",
        component: AboutComp,
        display: ABOUTME.display,
      },
      {
        order: EDUCATION.order,
        name: "education",
        component: EducationComp,
        display: EDUCATION.display,
      },
      {
        order: SKILLS.order,
        name: "skills",
        component: SkillsComp,
        display: SKILLS.display,
      },
      {
        order: EXPERIENCES.order,
        name: "experiences",
        component: ExperiencesComp,
        display: EXPERIENCES.display,
      },
      {
        order: OPENSOURCEPROJECTS.order,
        name: "openSource",
        component: OpenSourceProjectsComp,
        display: OPENSOURCEPROJECTS.display,
      },
    ],
    [
      ABOUTME,
      AboutComp,
      EDUCATION,
      EXPERIENCES,
      EducationComp,
      ExperiencesComp,
      SKILLS,
      SkillsComp,
      OPENSOURCEPROJECTS,
      OpenSourceProjectsComp,
    ]
  );

  const reOrderedSectionComponents = useMemo(
    () => sectionComponents.sort((a, b) => a.order - b.order),
    [sectionComponents]
  );

  const HorizontalSep = useMemo(
    () => <hr className={classNames("header-sep", { export: isExport })} />,
    [isExport]
  );
  return (
    <>
      <VersionModal
        displayVersionModal={displayVersionModal}
        setDisplayVersionModal={setDisplayVersionModal}
      />
      <Wrapper
        $pwaOffset={pwaOffset}
        className={classNames({
          export: isExport,
          "add-margin-top": false,
        })}
      >
        {!isExport && <ShortDesc>{shortDesc}</ShortDesc>}
        <PageHeader>
          {HorizontalSep}
          <span>{name}</span>
          {HorizontalSep}
        </PageHeader>
        <FlexBox $direction="column" $alignItems="center">
          <CurrentJobRole>{currentJobRole}</CurrentJobRole>
          <Separator className={classNames({ export: isExport })} />
        </FlexBox>
        <SectionsWrapper className={classNames({ export: isExport })}>
          {reOrderedSectionComponents.map((section, index) => {
            return section.display !== false ? (
              <SectionWrap
                key={index}
                className={classNames({
                  "last-info-section":
                    index === reOrderedSectionComponents.length - 2,
                })}
              >
                {section.component}
              </SectionWrap>
            ) : null;
          })}
          {!isMobile && (
            <Version
              href=""
              onClick={(e) => {
                e.preventDefault();
                setDisplayVersionModal(true);
              }}
            >
              v{version}
            </Version>
          )}
        </SectionsWrapper>
      </Wrapper>
    </>
  );
};

export default ProfileSections;

const Wrapper = styled.section<{ $pwaOffset: number }>`
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
