import { describe, it, expect, vi, beforeEach } from "vitest";
import { heroService, computeHeroImagesHash } from "./heroService.ts";
import type { HeroImage } from "@/types/hero.ts";

describe("heroService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return pre-cached local images from JSON file with 15 items and category mappings", () => {
    const images = heroService.getLocalHeroImages();
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBe(15);
    expect(images[0]).toHaveProperty("id");
    expect(images[0]).toHaveProperty("imageUrl");
    expect(images[0]).toHaveProperty("categoryName");
    expect(images[0]).toHaveProperty("categorySlug");
    expect(typeof images[0].categorySlug).toBe("string");
    expect(images[0].categorySlug!.length).toBeGreaterThan(0);
    expect(images[0].imageUrl.startsWith("data:image/")).toBe(true);
  });

  it("should return the sync tracking hash from the local JSON file", () => {
    const syncHash = heroService.getSyncHash();
    expect(typeof syncHash).toBe("string");
    expect(syncHash).toMatch(/^hero-[0-9a-f]+-15$/);
  });

  it("should compute deterministic checksum hash for hero images including categorySlug", () => {
    const sampleImages: Array<Partial<HeroImage> & { id: string }> = [
      {
        id: "hero-1",
        title: "Test Image 1",
        updatedAt: "2026-10-25T10:00:00Z",
        storageKey: "hero/test-1.webp",
        categorySlug: "illustrations-and-vector-art",
        sortOrder: 0,
        isActive: true,
      },
      {
        id: "hero-2",
        title: "Test Image 2",
        updatedAt: "2026-10-25T10:00:00Z",
        storageKey: "hero/test-2.webp",
        categorySlug: "ui-and-ux-kits",
        sortOrder: 1,
        isActive: true,
      },
    ];

    const hash1 = computeHeroImagesHash(sampleImages);
    const hash2 = computeHeroImagesHash(sampleImages);
    expect(hash1).toBe(hash2);

    // If categorySlug changes, hash must change
    const modified = [...sampleImages];
    modified[0] = { ...modified[0], categorySlug: "3d-models-and-cgi" };
    const hashModified = computeHeroImagesHash(modified);
    expect(hashModified).not.toBe(hash1);
  });

  it("should return updated=false when database matches local JSON syncHash", async () => {
    const localHash = heroService.getSyncHash();
    const localImages = heroService.getLocalHeroImages();

    // Mock getActiveHeroImages to return images matching localHash
    vi.spyOn(heroService, "getActiveHeroImages").mockResolvedValue(localImages);

    const result = await heroService.checkAndUpdateHeroImages();
    expect(result.updated).toBe(false);
    expect(result.images.length).toBe(15);
    expect(heroService.computeHash(localImages)).toBe(localHash);
  });

  it("should detect differences and call saveHeroImagesJson when backend data changes", async () => {
    const localImages = heroService.getLocalHeroImages();
    const modifiedImages: HeroImage[] = localImages.map((img, idx) => ({
      ...img,
      title: idx === 0 ? "Brand New Title" : img.title,
      updatedAt: idx === 0 ? "2026-10-25T23:59:59Z" : img.updatedAt,
    }));

    vi.spyOn(heroService, "getActiveHeroImages").mockResolvedValue(modifiedImages);
    const saveSpy = vi.spyOn(heroService, "saveHeroImagesJson").mockResolvedValue(true);

    const result = await heroService.checkAndUpdateHeroImages();
    expect(result.updated).toBe(true);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(result.images[0].title).toBe("Brand New Title");
  });
});
