"use client";
import styled from "styled-components";

/** Flex direction shorthand values supported by `FlexBox` / `FlexBoxSection`. */
export type FLEX_DIRECTION = "row" | "row-reverse" | "column" | "column-reverse";

/** Flex-wrap shorthand values supported by `FlexBox` / `FlexBoxSection`. */
export type FLEX_WRAP =
  | "wrap"
  | "nowrap"
  | "initial"
  | "inherit"
  | "wrap-reverse"
  | "unset";

/** Justify-content shorthand values supported by `FlexBox` / `FlexBoxSection`. */
export type JUSTIFY_CONTENT =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly"
  | "normal";

/** Align-items shorthand values supported by `FlexBox`. */
export type ALIGN_ITEMS =
  | "flex-start"
  | "flex-end"
  | "center"
  | "baseline"
  | "stretch"
  | "normal";

/** Reset-style button: transparent background, no border, pointer cursor. */
export const ActionBtn = styled.button`
  border: none;
  background-color: transparent;
  cursor: pointer;
  outline: none;
`;

/** Flex container with shorthand transient props for direction/justify/align/wrap/basis/gap. */
export const FlexBox = styled.div<{
  $direction?: FLEX_DIRECTION;
  $justifyContent?: JUSTIFY_CONTENT;
  $alignItems?: ALIGN_ITEMS;
  $flexWrap?: FLEX_WRAP;
  $flexBasis?: string;
  $gap?: number;
}>`
  display: flex;
  flex-direction: ${(props) => props.$direction || "row"};
  justify-content: ${(props) => props.$justifyContent || "normal"};
  align-items: ${(props) => props.$alignItems || "normal"};
  flex-wrap: ${(props) => props.$flexWrap || "nowrap"};
  flex-basis: ${(props) => props.$flexBasis || "auto"};
  gap: ${(props) => props.$gap || 0}px;
`;

/** Semantic `<section>` flavored flex container with the same shorthand props as `FlexBox`. */
export const FlexBoxSection = styled.section<{
  $direction?: FLEX_DIRECTION;
  $justifyContent?: JUSTIFY_CONTENT;
  $alignItems?: string;
  $flexWrap?: FLEX_WRAP;
  $flexBasis?: string;
}>`
  display: flex;
  flex-direction: ${(props) => props.$direction || "row"};
  justify-content: ${(props) => props.$justifyContent || "normal"};
  align-items: ${(props) => props.$alignItems || "normal"};
  flex-wrap: ${(props) => props.$flexWrap || "nowrap"};
  flex-basis: ${(props) => props.$flexBasis || "auto"};
  &.short-info {
    padding-left: 10px;
  }
`;

/** Grid container with shorthand transient props for template/justify/align. */
export const Grid = styled.div<{
  $gridTemplateColumns?: string;
  $gridTemplateRows?: string;
  $justifyItems?: string;
  $alignItems?: string;
}>`
  display: grid;
  grid-template-columns: ${(props) => props.$gridTemplateColumns || "1fr"};
  grid-template-rows: ${(props) => props.$gridTemplateRows || "1fr"};
  align-items: ${(props) => props.$alignItems || "normal"};
  justify-items: ${(props) => props.$justifyItems || "normal"};
`;
