import { FlexBox, FlexBoxSection } from "@/_components/common/Elements";
import {
  FacebookIcon,
  GithubIcon,
  LinkedInIcon,
  TwitterIcon,
  WhatsAppIcon,
} from "@/_components/svg";
import { LABEL_TEXT, LINKS, SECTIONS } from "@/_constants/profile";
import { ProfileContext } from "@/_store/profile/page/context";
import { ILink, ILinkInfo, LinkType } from "@/_store/profile/types";
import { getFilteredLinks } from "@/_utils/profile/server";
import React, { useContext, useMemo } from "react";
import styled from "styled-components";

interface IContactProps {
  links?: ILinkInfo;
  refObj?: React.MutableRefObject<any>;
}

const LinkComponents: Record<LinkType, JSX.Element> = {
  whatsApp: <WhatsAppIcon />,
  github: <GithubIcon />,
  linkedIn: <LinkedInIcon />,
  facebook: <FacebookIcon />,
  twitter: <TwitterIcon />,
};

const Contact = (props: IContactProps) => {
  const { links: propsLinks, refObj: propsRefObj } = props;
  const { isMobile, showComponentLibUrl } = useContext(ProfileContext);

  let {
    data: {
      sections: { links },
    },
    refs: { contactRef: refObj },
  } = useContext(ProfileContext);
  if (propsLinks && propsRefObj) {
    links = propsLinks;
    refObj = propsRefObj;
  }

  const filteredLinks = useMemo(
    () => getFilteredLinks(links.info as ILink[]),
    [links.info]
  );

  return (
    <ContactsSection
      $justifyContent="center"
      $direction="column"
      $alignItems="center"
      className="profile-section links"
      id={SECTIONS.LINKS}
      ref={refObj}
    >
      <FlexBox $justifyContent={isMobile ? "space-evenly" : "center"}>
        {filteredLinks.map((link, index) => (
          <div key={index} className="link-wrapper">
            <a
              className="link"
              href={link.link}
              target="_blank"
              key={link.label}
              rel="noopener noreferrer"
            >
              {LinkComponents[link.label]}
            </a>
          </div>
        ))}
      </FlexBox>
      {showComponentLibUrl && (
        <div
          className="developed-using"
          dangerouslySetInnerHTML={{
            __html: LABEL_TEXT.developedUsing.replace(
              "{0}",
              LINKS.NEXT_JS_LIBRARY
            ),
          }}
        />
      )}
    </ContactsSection>
  );
};

export default Contact;

const ContactsSection = styled(FlexBoxSection)`
  .hide-profile-url {
    display: none;
  }
  .link-wrapper {
    &:not(:last-child) {
      padding-right: 50px;
    }
  }
  .developed-using {
    margin-top: 5px;
    color: #f0f0f0;
    font-weight: bold;
    font-size: 13px;
    font-style: italic;
    letter-spacing: 0.5px;
    a {
      margin-left: 3px;
      color: #3498db;
      &:visited {
        color: #3498db;
      }
    }
  }

  @media screen and (max-width: 767px) {
    .link-wrapper {
      padding-right: 0;
    }
  }
`;
