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
  TwitterIcon,
  WhatsAppIcon,
} from "@/_components/svg";
import { LABEL_TEXT, LINKS } from "@/_constants/profile";

/**
 * ContactSection Component
 * Sticky contact section at the bottom of the viewport
 * Features: Social media links, developed using badge
 */

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
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  backdrop-filter: blur(20px);
  box-shadow: 0 -4px 30px rgba(0, 0, 0, 0.15);
  padding: 16px 20px;
  box-sizing: border-box;
  max-width: 100vw;

  @media screen and (max-width: 768px) {
    padding: 12px 16px;
  }

  @media screen and (max-width: 480px) {
    padding: 10px 12px;
  }
`;

const ContactContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  @media screen and (max-width: 480px) {
    gap: 8px;
  }
`;

const LinksContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;

  @media screen and (max-width: 768px) {
    gap: 16px;
  }

  @media screen and (max-width: 480px) {
    gap: 12px;
  }
`;

const LinkWrapper = styled.a`
  color: white;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  
  svg {
    width: 24px;
    height: 24px;
    fill: white;
    
    path {
      fill: white;
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
  }

  @media screen and (max-width: 768px) {
    width: 40px;
    height: 40px;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  @media screen and (max-width: 480px) {
    width: 36px;
    height: 36px;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const DevelopedUsing = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;

  a {
    color: white;
    text-decoration: underline;
    font-weight: 600;

    &:hover {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  @media screen and (max-width: 480px) {
    font-size: 11px;
  }
`;

export const ContactSection: React.FC = () => {
  const { showComponentLibUrl } = useContext(ProfileContext);
  const {
    data: { links },
  } = useContext(AppContext);

  const filteredLinks = useMemo(
    () => getFilteredLinks(links.info as ILink[]),
    [links.info]
  );

  return (
    <ContactContainer>
      <ContactContent>
        <LinksContainer>
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
        </LinksContainer>
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
      </ContactContent>
    </ContactContainer>
  );
};

export default ContactSection;
