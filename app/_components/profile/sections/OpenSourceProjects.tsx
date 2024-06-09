import {
  ActionBtn,
  FlexBox,
  ModalBanner,
  ModalContentWrap,
  ProjectInfoSectionWrapper,
  ProjectLink,
  SecHeader,
} from "@/_components/common/Elements";
import CustomModalComponent from "@/_components/common/ModalComponent";
import { LABEL_TEXT, SECTIONS } from "@/_constants/profile";
import { ProfileContext } from "@/_store/profile/page/context";
import { IOpenSource } from "@/_store/profile/types";
import { goToLink } from "@/_utils/profile/server";
import classNames from "classnames";
import { useCallback, useContext, useState } from "react";

const OpenSourceProjects = () => {
  const {
    data: {
      labels,
      sections: { openSourceProjects },
    },
    refs: { openSourceRef },
    setIsModalOpen,
  } = useContext(ProfileContext);
  const [currentProject, setCurrentProject] = useState<IOpenSource | null>(
    null
  );

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setCurrentProject(null);
  }, [setIsModalOpen]);

  return (
    <>
      <CustomModalComponent
        isOpen={!!currentProject}
        onRequestClose={closeModal}
      >
        {currentProject && (
          <ModalContentWrap
            $direction="column"
            className="open-source-content-wrap"
          >
            <ModalBanner className="header" />
            <section className="os-project">
              <h3 className="os-project-name">{currentProject.id}</h3>
              <p className="os-project-desc">{currentProject.description}</p>
              <p className="os-project-skills">
                <span className="label">{labels.skills}: </span>{" "}
                <span className="info">{currentProject.skillsUsed}</span>
              </p>
              <FlexBox className="os-project-links" $flexWrap="wrap">
                {currentProject.npm && (
                  <ProjectLink onClick={() => goToLink(currentProject.npm)}>
                    {labels.npm}
                  </ProjectLink>
                )}
                {currentProject.github && (
                  <ProjectLink onClick={() => goToLink(currentProject.github)}>
                    {labels.github}
                  </ProjectLink>
                )}
              </FlexBox>
            </section>
            <ActionBtn className="close" onClick={closeModal}>
              {LABEL_TEXT.close}
            </ActionBtn>
            <ModalBanner className="footer" />
          </ModalContentWrap>
        )}
      </CustomModalComponent>
      <section
        id={SECTIONS.OPEN_SOURCE_PROJECTS}
        ref={openSourceRef}
        className={classNames("profile-section", "experience")}
      >
        <SecHeader>{openSourceProjects.title}</SecHeader>
        <ProjectInfoSectionWrapper $flexWrap="wrap">
          {openSourceProjects.info.map((item) => {
            return (
              <FlexBox key={item.id} className="os-project">
                <ProjectLink
                  onClick={() => {
                    setCurrentProject(item);
                    setIsModalOpen(true);
                  }}
                >
                  {item.id}
                </ProjectLink>
              </FlexBox>
            );
          })}
        </ProjectInfoSectionWrapper>
      </section>
    </>
  );
};

export default OpenSourceProjects;
