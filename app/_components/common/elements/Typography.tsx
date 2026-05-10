"use client";
import styled from "styled-components";

/** Section header used across profile sections, with `export` and `about-me-title` variants. */
export const SecHeader = styled.header`
  font-size: 40px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #0f766e;
  text-align: center;
  &.export {
    text-align: unset;
    margin-bottom: 0;
    font-size: 30px;
  }
  &.about-me-title {
    text-align: left;
    @media screen and (max-width: 767px) {
      margin-bottom: 10px;
    }
  }
  @media screen and (max-width: 767px) {
    text-align: left;
    font-size: 28px;
  }
`;

/** Description paragraph; supports `about`, `education` and `export` className variants. */
export const Desc = styled.p`
  margin: 0;
  padding-right: 15%;
  color: #374151;
  line-height: 1.6;

  &.about {
    padding-left: 0;
    padding-top: 10px;
  }
  &.education {
    text-align: center;
    padding-right: 0;
    @media screen and (max-width: 767px) {
      text-align: left;
      padding: 0 5px;
    }
  }
  &.export {
    text-align: left;
  }
  strong {
    color: #1f2937;
    font-weight: 600;
  }

  @media screen and (max-width: 767px) {
    padding-right: 0;
    &.about {
      padding-top: 20px;
    }
  }
`;

/** Italic centered text used by auto-closing toast notifications. */
export const AutoCloseToastMessage = styled.div`
  font-family: var(--font), arial, helvetica, sans-serif;
  text-align: center;
  font-style: italic;
  letter-spacing: 0.5px;
  color: #3f9c35;
`;

/** Pill-styled anchor used to render a version badge. */
export const Version = styled.a`
  color: #f0f0f0;
  margin-top: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  background: rgb(52, 152, 219);
  opacity: 0.7;
  padding: 5px 10px;
  border-radius: 20px;
  width: fit-content;
  margin: 0 auto;
  margin-bottom: 60px;
  &:hover {
    opacity: 1;
  }
`;
