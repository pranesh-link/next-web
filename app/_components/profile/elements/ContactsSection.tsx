import styled from "styled-components";
import { FlexBoxSection } from "@/_components/common/Elements";

/** Bottom-fixed contact links section (with `export` and link styles). */
export const ContactsSection = styled(FlexBoxSection)`
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
