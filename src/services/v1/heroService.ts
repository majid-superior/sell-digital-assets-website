// src/services/v1/heroService.ts
import { apiClient } from "@/services/api.ts";
import type { HeroImage } from "@/types/hero.ts";

export interface RawHeroPayload {
  id?: string;
  title?: string;
  subtitle?: string | null;
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

export const heroService = {
  /**
   * Fetches active hero showcase images for public landing page display.
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
          imageUrl: raw.imageUrl || raw.image_url || "",
          storageKey: raw.storageKey ?? raw.storage_key ?? null,
          sortOrder: Number.isFinite(raw.sortOrder)
            ? Number(raw.sortOrder)
            : Number(raw.sort_order || 0),
          isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : Boolean(raw.is_active ?? true),
          createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
          updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
        }));
    } catch {
      // In case of network interruption or unconfigured database, return empty list gracefully
      return [];
    }
  },
};

