"use client";
import styled from "styled-components";
import { FlexBoxSection } from "./Layout";

/** Generic section wrapper used by experience entries; defines org-name, duration, responsibilities styles. */
export const SectionWrapper = styled(FlexBoxSection)`
  padding-left: 20px;
  padding-right: 15%;
  margin-left: 25%;
  .project-titles-wrap {
    max-width: 70%;
    margin-top: 15px;
  }
  &.export {
    margin-left: 0;
    padding-left: 0px;
  }
  .org-name {
    font-size: 22px;
    margin-block: 5px;
    text-align: center;
    &.current {
      color: #3f9c35;
    }
    &.previous {
      color: #8a8982;
    }
  }
  .duration {
    font-size: 13px;
    text-transform: uppercase;
    font-weight: bold;
  }
  .projects-label,
  .clients-label {
    span {
      margin-left: 5px;
    }
  }
  .projects-label,
  .clients-label,
  .responsibilities {
    display: flex;
    margin-block-start: 10px;
    margin-block-end: 0;
    label {
      text-transform: uppercase;
      margin-right: 10px;
    }
    span {
      font-weight: 600;
    }
    div {
      font-weight: normal;
    }
  }
  .responsibilities {
    flex-direction: column;
  }
  .org-projects {
    padding-left: 10px;
  }
  .responsibilities {
    ul {
      padding-inline-start: 5px;
      list-style-type: none;
      margin-block: 5px;
      li {
        display: flex;
        padding-bottom: 7px;
        align-items: center;
        &::before {
          content: "✓";
          color: #3f9c35;
          font-size: 20px;
          font-weight: bold;
          margin-right: 10px;
        }
      }
    }
  }

  @media screen and (max-width: 767px) {
    padding: 0;
    margin-left: 0;
    ul {
      margin: 0;
      padding-left: 25px;
    }
    .org-name {
      font-size: 20px;
    }

    .project-titles-wrap {
      max-width: unset;
    }

    .open-source-project-name {
      font-size: 18px;
    }
  }
`;
