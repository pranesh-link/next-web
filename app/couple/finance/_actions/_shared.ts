import { ZodError } from "zod";

/**
 * Normalize an unknown error into the `{ error, validationErrors? }` shape returned by finance server actions.
 *
 * @param error - The thrown value.
 * @param fallback - Fallback message used when the error is not a recognized type.
 * @returns An object with `error` (string) and optionally `validationErrors` (per-field list).
 */
export function formatActionError(error: unknown, fallback: string) {
  if (error instanceof ZodError) {
    const { fieldErrors, formErrors } = error.flatten();
    const normalizedFieldErrors: Record<string, string[]> = {};

    for (const [key, messages] of Object.entries(fieldErrors as Record<string, string[] | undefined>)) {
      if (messages && messages.length > 0) {
        normalizedFieldErrors[key] = messages;
      }
    }

    return {
      error: formErrors[0] ?? "Validation failed",
      validationErrors: normalizedFieldErrors,
    };
  }

  return { error: error instanceof Error ? error.message : fallback };
}
