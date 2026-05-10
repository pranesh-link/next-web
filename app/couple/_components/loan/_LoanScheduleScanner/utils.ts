export { formatCurrency } from "@/_lib/formatters";

/**
 * Format a byte count as a human-readable size.
 *
 * @param bytes - File size in bytes.
 * @returns Size string such as `512 B`, `1.4 KB`, `3.2 MB`.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export { compressImage } from "@/_lib/image-compression";
export { getConfidenceLevel } from "@/couple/_components/shared/confidence-helpers";
