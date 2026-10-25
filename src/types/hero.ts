// src/types/hero.ts

export interface HeroImage {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  storageKey: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

