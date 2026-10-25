// src/types/hero.ts

export interface HeroImage {
  id: string;
  title: string;
  subtitle: string | null;
  detail?: string | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  imageUrl: string;
  storageKey: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HeroJsonPayload {
  syncHash: string;
  lastUpdated: string;
  version: string;
  count: number;
  images: HeroImage[];
}
