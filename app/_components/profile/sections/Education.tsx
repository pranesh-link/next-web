import { Desc, SecHeader } from "@/_components/common/Elements";
import { SECTIONS } from "@/_constants/profile";
import { ProfileContext } from "@/_store/profile/page/context";
import classNames from "classnames";
import { useContext } from "react";

const Education = () => {
  const {
    isExport,
    data: {
      sections: { education },
    },
    refs: { educationRef: refObj },
  } = useContext(ProfileContext);
  return (
    <section
      className="profile-section"
      id={isExport ? "" : SECTIONS.EDUCATION}
      ref={isExport ? null : refObj}
    >
      <SecHeader className={classNames({ export: isExport })}>
        {education.title}
      </SecHeader>
      <Desc
        className={classNames("education", { export: isExport })}
        dangerouslySetInnerHTML={{ __html: education.info as string }}
      />
    </section>
  );
};

export default Education;
