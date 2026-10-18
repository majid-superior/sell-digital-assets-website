import { describe, it, expect } from "vitest";
import { resolveStorageUrl, resolveMediaUrl } from "./media.ts";

describe("Storage & Media URL Resolution", () => {
  it("preserves external S3, Supabase, and R2 presigned URLs untouched", () => {
    const s3Url = "https://kvhntcdqispownhlsoxo.storage.supabase.co/storage/v1/s3/vault/assets/123/file.zip?X-Amz-Signature=abc";
    expect(resolveStorageUrl(s3Url)).toBe(s3Url);
    expect(resolveMediaUrl(s3Url)).toBe(s3Url);
  });

  it("preserves blob URLs for local image previews", () => {
    const blobUrl = "blob:http://localhost:5173/01234567-89ab-cdef-0123-456789abcdef";
    expect(resolveMediaUrl(blobUrl)).toBe(blobUrl);
  });

  it("normalizes localhost backend URLs to route through API base path", () => {
    const localUrl = "http://localhost:5000/api/v1/storage/upload?key=test.zip&token=abc";
    const resolved = resolveStorageUrl(localUrl);
    expect(resolved).not.toContain("localhost:5000");
    expect(resolved).toContain("/api/v1/storage/upload?key=test.zip&token=abc");
  });

  it("normalizes relative /api paths correctly", () => {
    const relativeUrl = "/api/v1/storage/download?key=test.zip&token=abc";
    const resolved = resolveStorageUrl(relativeUrl);
    expect(resolved).toContain("/api/v1/storage/download?key=test.zip&token=abc");
  });

  it("handles null and empty input safely", () => {
    expect(resolveStorageUrl("")).toBe("");
    expect(resolveStorageUrl(null)).toBe("");
    expect(resolveMediaUrl("")).toBe("");
    expect(resolveMediaUrl(null)).toBe("");
  });
});

