"use client";

import { FlexBox, FlexBoxSection } from "@/_components/common/Elements";
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
import React, { useContext, useMemo, useRef } from "react";
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

const ContactsSection = styled(FlexBoxSection)`
  &.links {
    padding: 15px 0 5px;
    background-color: #222222;
    position: fixed;
    bottom: 0;
    width: 100%;
    margin-bottom: 0;
    z-index: 2;
    &.export {
      position: static;
      background-color: transparent;
      @media screen and (max-width: 767px) {
        display: flex;
        position: static;
        padding: 20px 0;
        background-color: transparent;
      }
      .link {
        padding-right: 15px;
      }
    }

    .link {
      @media screen and (max-width: 767px) {
        margin-bottom: 0;
      }
      a {
        padding: 10px 15px;
        text-decoration: none;
        border-radius: 20px;
        background-color: #0c77b9;
        &:hover {
          background-color: #3f9c35;
        }
      }
      img {
        height: 25px;
        &.Github {
          @media screen and (max-width: 767px) {
            height: 28px;
          }
        }
      }
      a,
      span {
        color: #f0f0f0;
      }
      .link-separator {
        &:last-child {
          display: none;
        }
      }
    }
  }
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
