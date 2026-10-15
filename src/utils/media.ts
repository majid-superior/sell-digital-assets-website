// src/utils/media.ts

/**
 * Normalizes an asset media or image URL to ensure compatibility across
 * development proxies, relative paths, and production CDNs.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Convert absolute localhost backend URLs to relative /api paths
  // to ensure smooth Vite proxying, same-origin CSP clearance, and no mixed-content issues
  if (
    trimmed.startsWith("http://localhost:5000/api/") ||
    trimmed.startsWith("http://127.0.0.1:5000/api/")
  ) {
    return trimmed.replace(/^http:\/\/(localhost|127\.0\.0\.1):5000/, "");
  }

  return trimmed;
}

