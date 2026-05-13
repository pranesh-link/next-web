/**
 * Converts plain-text URLs in a string into safe clickable anchor tags.
 *
 * Matches `http://`, `https://`, and bare `www.` URLs. The produced `<a>` tags
 * open in a new tab with `rel="noopener noreferrer"` to prevent tab-napping.
 *
 * @param text - Raw text that may contain URLs.
 * @returns HTML string with URLs wrapped in `<a>` tags. All non-URL characters
 *   are HTML-escaped to prevent XSS injection.
 */
export function linkify(text: string): string {
  // Escape HTML special chars first to prevent XSS
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  // Match http(s):// URLs or bare www. URLs
  const URL_REGEX = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/g;

  return escaped.replace(URL_REGEX, (url) => {
    const href = url.startsWith("www.") ? `https://${url}` : url;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}
