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
import {
  CurrentJobRole,
  PageHeader,
  SectionWrap,
  Separator,
  ShortDesc,
  Wrapper,
} from "./Elements";
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
          isMobile,
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
