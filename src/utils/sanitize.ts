/**
 * Validation and sanitization utilities for dynamic stylesheets, URLs, and external resources.
 */

const SAFE_COLOR_REGEX =
  /^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgb|rgba|hsl|hsla|oklch)\([^()<>;"'`\\/]*\)|[a-zA-Z]{3,20})$/;

/**
 * Validates whether a value is a safe CSS color string.
 * Supports: #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), hsla(), oklch(), and safe color keywords.
 * Disallows semicolons, brackets, quotes, slashes, url(), expressions, and script escape sequences.
 */
export function isSafeCssColor(color: unknown): boolean {
  if (!color || typeof color !== "string") return false;
  const trimmed = color.trim();
  if (/[;<>{}"'`\\/]/.test(trimmed)) return false;
  if (/\b(?:url|expression|javascript|eval)\b/i.test(trimmed)) return false;
  return SAFE_COLOR_REGEX.test(trimmed);
}

/**
 * Validates whether a URL is a safe static icon/image URL.
 * Only allows relative paths starting with single '/' (not '//' or '/\')
 * or absolute URLs strictly using http: or https: protocols.
 */
export function isSafeIconUrl(url: unknown): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  // Safe relative paths starting with single slash
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes("\\")
  ) {
    return true;
  }
  // Safe absolute URLs with http or https protocol
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
