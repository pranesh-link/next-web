/**
 * Client-side image compression helper.
 *
 * Canonical implementation shared by upload flows (receipts, loan schedules, …).
 */

/** Options controlling {@link compressImage} behaviour. */
export type CompressImageOptions = {
  /**
   * Skip compression when the source file is already smaller than this many
   * bytes. Defaults to `200_000` (≈200 KB).
   */
  maxBytes?: number;
  /** Max width or height in pixels for the output. Defaults to `1500`. */
  maxDim?: number;
  /** JPEG quality between 0 and 1. Defaults to `0.8`. */
  quality?: number;
};

/**
 * Compress an image client-side to a max dimension and JPEG quality before upload.
 *
 * Skips non-image inputs and small files (< `maxBytes`). If the resulting blob
 * is not smaller than the source, the original file is returned untouched.
 *
 * @param file - The source file selected by the user.
 * @param options - Optional thresholds; see {@link CompressImageOptions}.
 * @returns A Promise resolving to a compressed `File`, or the original file.
 */
export function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  const { maxBytes = 200_000, maxDim = 1500, quality = 0.8 } = options;
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/") || file.size < maxBytes) {
      resolve(file);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim && file.size < 500_000) {
        resolve(file);
        return;
      }
      const scale = Math.min(maxDim / width, maxDim / height, 1);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(
              new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                type: "image/jpeg",
              }),
            );
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}
