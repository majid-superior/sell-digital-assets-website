// src/features/public-catalog/types.ts
import type { DigitalAsset } from "../../types/asset.ts";

export interface PublicSellerStorefront {
  sellerId: string;
  url: string;                   // e.g., "seller01"
  displayName: string;
  avatarUrl?: string;
  title: string;                 // Storefront custom title
  description: string;           // Storefront custom description
  bannerUrl: string;             // Storefront banner image
  isVisible: boolean;            // Must be true and url !== "" to render publicly
  featuredAsset: DigitalAsset | null;
  assets: DigitalAsset[];
  rating: number;
  reviewCount: number;
  joinedAt: string;
}

