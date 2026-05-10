"use client";

/**
 * Keyframes and easing constant shared across all loan-page styled atoms.
 *
 * Re-exports `EASING` from `_utils` and defines slideDown / fadeOut /
 * fillExpand / fadeIn keyframes used by `_styled.ts` and `_styled-schedule.ts`.
 */

import { keyframes } from "styled-components";

export { EASING } from "./_utils";

export const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

export const fillExpand = keyframes`
  from { width: 0%; }
`;

export const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;
