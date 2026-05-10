/** Easing curves used across animations. */
export const EASING_CURVES = {
  /** Default smooth ease-out — `cubic-bezier(0.16, 1, 0.3, 1)`. */
  default: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

/** Default easing curve. Use this for most transitions/animations. */
export const EASING = EASING_CURVES.default;
