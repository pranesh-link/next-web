"use client";
import React, { useContext, useMemo } from "react";
import styled from "styled-components";
import { ProfileContext } from "@/_store/profile/page/context";
import { AppContext } from "@/_store/app/context";
import { ILink, LinkType } from "@/_store/profile/types";
import { getFilteredLinks } from "@/_utils/profile/server";
import {
  FacebookIcon,
  GithubIcon,
  LinkedInIcon,
  MailIcon,
  PhoneIcon,
  TwitterIcon,
  WhatsAppIcon,
} from "@/_components/svg";
import { LABEL_TEXT, LINKS } from "@/_constants/profile";

const LinkComponents: Record<LinkType, React.JSX.Element> = {
  whatsApp: <WhatsAppIcon />,
  github: <GithubIcon />,
  linkedIn: <LinkedInIcon />,
  facebook: <FacebookIcon />,
  twitter: <TwitterIcon />,
};

const ContactContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--nav-bg);
  backdrop-filter: blur(20px);
  border-top: 1px solid var(--surface-hover);
  padding: 12px 20px;
  box-sizing: border-box;
  max-width: 100vw;

  @media screen and (max-width: 768px) {
    padding: 10px 16px;
  }

  @media screen and (max-width: 480px) {
    padding: 8px 12px;
  }
`;

const ContactContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const ConnectLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  white-space: nowrap;
`;

const LocationText = styled.span`
  font-size: 14px;
  color: #d4d4d8;
  font-weight: 500;
  white-space: nowrap;
  margin-right: 8px;

  @media screen and (max-width: 600px) {
    display: none;
  }
`;

const IconsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media screen and (max-width: 480px) {
    gap: 10px;
  }
`;

const LinkWrapper = styled.a`
  color: var(--text-dim);
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border);

  svg {
    width: 20px;
    height: 20px;
    fill: var(--text-dim);

    path {
      fill: var(--text-dim);
    }
  }

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);

    svg, svg path {
      fill: var(--accent-light);
    }
  }

  @media screen and (max-width: 480px) {
    width: 36px;
    height: 36px;

    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const DevelopedUsing = styled.div`
  font-size: 11px;
  color: #52525b;
  text-align: center;

  a {
    color: var(--text-muted);
    text-decoration: underline;
    font-weight: 500;

    &:hover {
      color: var(--text-dim);
    }
  }
`;

export const DarkContactSection: React.FC = () => {
  const {
    showComponentLibUrl,
    data: {
      sections: { details },
    },
  } = useContext(ProfileContext);
  const {
    data: { links },
  } = useContext(AppContext);

  const filteredLinks = useMemo(
    () => getFilteredLinks(links.info as ILink[]),
    [links.info]
  );

  const location = details.info.find((d) => d.id === "location");
  const mobile = details.info.find((d) => d.id === "mobile");
  const email = details.info.find((d) => d.id === "email");

  return (
    <ContactContainer id="contact">
      <ContactContent>
        <ConnectLabel>Let&apos;s connect</ConnectLabel>
        {location && <LocationText>{location.info}</LocationText>}
        <IconsRow>
          {mobile && (
            <LinkWrapper href={`tel:${mobile.info}`} title="Call">
              <PhoneIcon />
            </LinkWrapper>
          )}
          {email && (
            <LinkWrapper href={`mailto:${email.info}`} title="Email">
              <MailIcon />
            </LinkWrapper>
          )}
          {filteredLinks.map((link, index) => (
            <LinkWrapper
              key={index}
              href={link.link}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
            >
              {LinkComponents[link.label]}
            </LinkWrapper>
          ))}
        </IconsRow>
      </ContactContent>
      {showComponentLibUrl && (
        <DevelopedUsing
          dangerouslySetInnerHTML={{
            __html: LABEL_TEXT.developedUsing.replace(
              "{0}",
              LINKS.NEXT_JS_LIBRARY
            ),
          }}
        />
      )}
    </ContactContainer>
  );
};

export default DarkContactSection;
