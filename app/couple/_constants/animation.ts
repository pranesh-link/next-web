/**
 * Notification banner display + fade-out timings (milliseconds).
 *
 * Banner shows for `displayMs`, then a `fadeOutMs` exit animation runs.
 */
export const NOTIFICATION_TIMINGS = {
  /** How long the banner stays fully visible. */
  displayMs: 3000,
  /** Length of the fade-out exit animation. */
  fadeOutMs: 300,
} as const;
