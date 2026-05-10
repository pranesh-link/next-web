/**
 * Confidence-band helpers shared by AI-extraction result UIs.
 */

/**
 * Bucket a confidence score 0-100 into a high/medium/low band.
 *
 * @param c - Confidence score from 0 to 100.
 * @returns `"high"` (≥75), `"medium"` (≥50), or `"low"` otherwise.
 */
export function getConfidenceLevel(c: number): "high" | "medium" | "low" {
  if (c >= 75) return "high";
  if (c >= 50) return "medium";
  return "low";
}
