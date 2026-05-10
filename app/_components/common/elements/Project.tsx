"use client";
import styled from "styled-components";
import { ActionBtn, FlexBoxSection } from "./Layout";

/** Outer wrapper for an individual project info section (org or open-source). */
export const ProjectInfoSectionWrapper = styled(FlexBoxSection)`
  margin-bottom: 20px;
  padding: 20px 20px 0;
  .project-info {
    margin-left: 10px;
    &.export {
      margin-left: 0;
    }
    @media screen and (max-width: 767px) {
      margin-left: 0px;
    }
  }
  .info-label {
    font-weight: bold;
    flex-basis: 25%;
    margin-right: 10px;
    text-transform: uppercase;
    color: #3e3e3e;
    &.export {
      flex-basis: 35%;
    }
    .show-hide {
      background-color: #3f9c35;
      border: none;
      color: #f0f0f0;
      cursor: pointer;
      outline: none;
      border-radius: 15px;
      padding: 1px 10px;
      margin-left: 10px;
      &.hide {
        background-color: #e02020;
      }
      &:hover {
        background-color: #0c77b9;
      }
    }
  }
  .info-wrapper {
    line-height: 2;
    @media screen and (max-width: 767px) {
      &:not(.export) {
        flex-direction: column;
      }
    }
  }
  .description,
  .responsibilities {
    margin-left: 20px;
    &.export {
      margin-left: 0;
    }
    @media screen and (max-width: 767px) {
      margin-left: 0px;
    }
  }

  @media screen and (max-width: 767px) {
    &.os-projects {
      justify-content: normal;
    }
  }
`;

/** Project name header with `expanded` className styling. */
export const ProjectName = styled.header`
  font-weight: bold;
  font-size: 20px;
  margin-bottom: 10px;
  color: #3e3e3e;
  display: flex;
  align-items: center;
  cursor: pointer;
  img {
    margin-right: 5px;
    width: 15px;
    height: 15px;
  }
  &.expanded {
    color: #22a39f;
    img {
      filter: invert(55%) sepia(64%) saturate(466%) hue-rotate(129deg)
        brightness(84%) contrast(94%);
    }
  }
  @media screen and (max-width: 767px) {
    font-size: 18px;
  }
`;

/** Pill-styled action button used as a project link. */
export const ProjectLink = styled(ActionBtn)`
  padding: 10px 15px;
  border-radius: 20px;
  background: #3498db;
  color: #f0f0f0;
  margin-bottom: 15px;
  margin-right: 20px;
  &:hover {
    background: #3f9c35;
  }
`;

/** Page-level container that adds optional top padding via `$paddingTop`. */
export const PageContainer = styled.div<{ $paddingTop?: number }>`
  padding-top: ${(props) => props.$paddingTop || 0}px;
  transition: all 1s ease-out;
`;
