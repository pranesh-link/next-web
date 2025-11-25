"use client";

import { FlexBox } from "@/_components/common/Elements";
import {
  FacebookIcon,
  GithubIcon,
  LinkedInIcon,
  TwitterIcon,
  WhatsAppIcon,
} from "@/_components/svg";
import { LABEL_TEXT, LINKS, SECTIONS } from "@/_constants/profile";
import { AppContext } from "@/_store/app/context";
import { ProfileContext } from "@/_store/profile/page/context";
import { ILink, ILinkInfo, LinkType } from "@/_store/profile/types";
import { getFilteredLinks } from "@/_utils/profile/server";
import React, { JSX, useContext, useMemo, useRef } from "react";
import { ContactsSection } from "../Elements";

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
  let refObj = useRef<HTMLDivElement>(null);
  let {
    data: { links },
  } = useContext(AppContext);
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
