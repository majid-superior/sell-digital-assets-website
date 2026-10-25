// src/services/v1/heroService.ts
import { apiClient } from "@/services/api.ts";
import type { HeroImage, HeroJsonPayload } from "@/types/hero.ts";
import heroImagesData from "@/features/website/data/heroImages.json";

export interface RawHeroPayload {
  id?: string;
  title?: string;
  subtitle?: string | null;
  detail?: string | null;
  category_name?: string | null;
  categoryName?: string | null;
  category_slug?: string | null;
  categorySlug?: string | null;
  image_url?: string;
  imageUrl?: string;
  storage_key?: string | null;
  storageKey?: string | null;
  sort_order?: number;
  sortOrder?: number;
  is_active?: boolean;
  isActive?: boolean;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface ActiveHeroResponse {
  success?: boolean;
  data?: RawHeroPayload[];
}

/**
 * Computes a deterministic checksum hash from hero image items to check for changes
 * between the local JSON file and the backend database.
 */
export function computeHeroImagesHash(
  images: Array<{
    id: string;
    updatedAt?: string;
    storageKey?: string | null;
    title?: string;
    categorySlug?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }>,
): string {
  const signature = images
    .map(
      (img) =>
        `${img.id}:${img.updatedAt || ""}:${img.storageKey || ""}:${img.title || ""}:${img.categorySlug || ""}:${img.sortOrder ?? 0}:${img.isActive !== false}`,
    )
    .join("|");

  let hash = 2166136261;
  for (let i = 0; i < signature.length; i++) {
    hash ^= signature.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `hero-${(hash >>> 0).toString(16)}-${images.length}`;
}

/**
 * Converts a remote or relative image URL into a base64 Data URL.
 */
async function convertImageUrlToBase64(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return url;
    }
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          resolve(url);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read image blob"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

export const heroService = {
  /**
   * Returns pre-cached hero images from the local JSON file immediately (0ms latency).
   */
  getLocalHeroImages(): HeroImage[] {
    const local = heroImagesData as unknown as HeroJsonPayload;
    if (Array.isArray(local?.images) && local.images.length > 0) {
      return local.images;
    }
    return [];
  },

  /**
   * Returns the tracking checksum variable from the local JSON file.
   */
  getSyncHash(): string {
    const local = heroImagesData as unknown as HeroJsonPayload;
    return local?.syncHash || "";
  },

  /**
   * Exposes hash computation utility for testing and consistency.
   */
  computeHash: computeHeroImagesHash,

  /**
   * Fetches active hero showcase images from the backend REST API.
   */
  async getActiveHeroImages(signal?: AbortSignal): Promise<HeroImage[]> {
    try {
      const response = await apiClient.get<ActiveHeroResponse | RawHeroPayload[]>(
        "/api/v1/hero/active",
        { signal },
      );

      const rawList: RawHeroPayload[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];

      return rawList
        .filter((raw): raw is RawHeroPayload => Boolean(raw && typeof raw === "object"))
        .map((raw: RawHeroPayload): HeroImage => ({
          id: raw.id || crypto.randomUUID(),
          title: raw.title || "Hero Showcase",
          subtitle: raw.subtitle ?? null,
          detail: raw.detail ?? null,
          categoryName: (raw.categoryName || raw.category_name) ?? null,
          categorySlug: (raw.categorySlug || raw.category_slug) ?? null,
          imageUrl: raw.imageUrl || raw.image_url || "",
          storageKey: raw.storageKey ?? raw.storage_key ?? null,
          sortOrder: Number.isFinite(raw.sortOrder)
            ? Number(raw.sortOrder)
            : Number(raw.sort_order || 0),
          isActive:
            raw.isActive !== undefined
              ? Boolean(raw.isActive)
              : Boolean(raw.is_active ?? true),
          createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        }));
    } catch {
      return [];
    }
  },

  /**
   * Saves updated hero images payload to the local JSON file on disk.
   */
  async saveHeroImagesJson(payload: HeroJsonPayload): Promise<boolean> {
    try {
      // Primary: try internal Vite dev server endpoint
      const res = await fetch("/api/internal/update-hero-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        return true;
      }

      // Fallback: try backend API proxy endpoint
      const fallbackRes = await fetch("/api/v1/hero/update-frontend-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      return fallbackRes.ok;
    } catch {
      return false;
    }
  },

  /**
   * Checks the backend database against local JSON images using the syncHash variable.
   * If any image differs or new images are added, converts them to base64, updates the JSON file,
   * and returns the updated image set so future loads use the updated images.
   */
  async checkAndUpdateHeroImages(
    signal?: AbortSignal,
  ): Promise<{ updated: boolean; images: HeroImage[] }> {
    const localImages = this.getLocalHeroImages();
    const currentHash = this.getSyncHash();

    // 1. Fetch live active records from the backend database
    const dbImages = await this.getActiveHeroImages(signal);

    // If backend is unreachable or has no records, retain reliable local JSON images
    if (!Array.isArray(dbImages) || dbImages.length === 0) {
      return { updated: false, images: localImages };
    }

    // 2. Compare using the syncHash variable
    const dbHash = computeHeroImagesHash(dbImages);
    if (currentHash && dbHash === currentHash) {
      // JSON file is already up to date with backend database
      return { updated: false, images: localImages };
    }

    // 3. Difference detected! Prepare updated base64 image data
    const updatedImages: HeroImage[] = [];

    for (const dbImg of dbImages.slice(0, 15)) {
      // Check if we already have this image cached as base64 in local JSON
      const existingMatch = localImages.find(
        (local) =>
          local.id === dbImg.id &&
          local.storageKey === dbImg.storageKey &&
          local.updatedAt === dbImg.updatedAt &&
          local.imageUrl.startsWith("data:image/"),
      );

      if (existingMatch) {
        // Reuse existing base64 image and local category mappings without re-downloading
        updatedImages.push({
          ...dbImg,
          imageUrl: existingMatch.imageUrl,
          detail: dbImg.detail || existingMatch.detail || null,
          categoryName: dbImg.categoryName || existingMatch.categoryName || null,
          categorySlug: dbImg.categorySlug || existingMatch.categorySlug || null,
        });
      } else if (dbImg.imageUrl.startsWith("data:image/")) {
        // Already base64
        updatedImages.push(dbImg);
      } else {
        // Fetch new/updated image and convert to base64 Data URL
        const base64Url = await convertImageUrlToBase64(dbImg.imageUrl, signal);
        updatedImages.push({
          ...dbImg,
          imageUrl: base64Url,
        });
      }
    }

    const payload: HeroJsonPayload = {
      syncHash: dbHash,
      lastUpdated: new Date().toISOString(),
      version: "1.0.0",
      count: updatedImages.length,
      images: updatedImages,
    };

    // 4. Update the JSON file on disk for future instant loads
    await this.saveHeroImagesJson(payload);

    return { updated: true, images: updatedImages };
  },
};
