// src/utils/media.ts
import { buildRequestUrl } from "@/services/interceptors/requestInterceptor.ts";

/**
 * Normalizes an upload or download storage URL returned from the backend.
 * Ensures that if the backend generated a localhost/127.0.0.1 or relative path,
 * it is mapped to the configured live backend API base URL in production,
 * while preserving direct remote storage URLs (such as S3, Supabase Storage, R2).
 */
export function resolveStorageUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // 1. If it's a relative path (/api/v1/storage/upload?...), route via buildRequestUrl
  if (trimmed.startsWith("/")) {
    return buildRequestUrl(trimmed);
  }

  // 2. If it points to localhost or 127.0.0.1 (any port, e.g. :5000), strip localhost and resolve
  const localhostMatch = trimmed.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)$/);
  if (localhostMatch) {
    const cleanPath = localhostMatch[3];
    return buildRequestUrl(cleanPath);
  }

  // 3. Otherwise (e.g. S3, Supabase, Cloudflare R2 presigned URLs), return as-is
  return trimmed;
}

/**
 * Normalizes an asset media or image URL to ensure compatibility across
 * development proxies, relative paths, and production CDNs.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // If localhost or relative /api path, resolve to the actual API endpoint
  if (
    trimmed.startsWith("/") ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/.*)$/.test(trimmed)
  ) {
    return resolveStorageUrl(trimmed);
  }

  return trimmed;
}

