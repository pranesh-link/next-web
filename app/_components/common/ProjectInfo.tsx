import {
  FlexBox,
  FlexBoxSection,
  ProjectInfoSectionWrapper,
  ProjectName,
} from "@/_components/common/Elements";
import {
  EXPANDABLE_INFOS,
  LABEL_TEXT,
  SHORT_INFOS,
} from "@/_constants/profile";
import { ProfileContext } from "@/_store/profile/page/context";
import { IProjectExperience } from "@/_store/profile/types";
import classNames from "classnames";
import React from "react";

interface IProjectInfoProps {
  project: IProjectExperience;
}
const ProjectInfo = (props: IProjectInfoProps) => {
  const {
    project,
    project: { title },
  } = props;
  const { isExport, isMobile } = React.useContext(ProfileContext);

  return (
    <ProjectInfoSectionWrapper $direction="column" className="keep-together">
      <ProjectName>
        <span>{title}</span>
      </ProjectName>
      <FlexBoxSection
        $direction="column"
        className={classNames("project-info", { export: isExport })}
      >
        {isMobile ? (
          <FlexBoxSection $direction="column" className="project-short-info">
            {SHORT_INFOS.map((key, index) => (
              <FlexBox
                className={classNames("info-wrapper", { export: isExport })}
                key={index}
              >
                <label
                  className={classNames("info-label", { export: isExport })}
                >
                  {LABEL_TEXT[key]}
                </label>
                <div className="info">{project[key]}</div>
              </FlexBox>
            ))}
          </FlexBoxSection>
        ) : (
          <FlexBox
            className={classNames("info-wrapper", "project-short-info", {
              export: isExport,
            })}
          >
            <FlexBoxSection $direction="column">
              {SHORT_INFOS.map((key, index) => (
                <label
                  key={index}
                  className={classNames("info-label", { export: isExport })}
                >
                  {LABEL_TEXT[key]}
                </label>
              ))}
            </FlexBoxSection>
            <FlexBoxSection $direction="column" className="short-info">
              {SHORT_INFOS.map((key, index) => (
                <div key={index} className="info">
                  {project[key]}
                </div>
              ))}
            </FlexBoxSection>
          </FlexBox>
        )}
        {EXPANDABLE_INFOS.map((key, index) => {
          return (
            <FlexBox $direction="column" className="info-wrapper" key={index}>
              <label className="info-label">
                <span>{LABEL_TEXT[key]}</span>
              </label>
              <div
                className={classNames("info", key, { export: isExport })}
                dangerouslySetInnerHTML={{ __html: project[key] }}
              />
            </FlexBox>
          );
        })}
      </FlexBoxSection>
    </ProjectInfoSectionWrapper>
  );
};

export default ProjectInfo;
