// src/features/seller-dashboard/types.ts
export interface SellerStorefrontConfig {
  url: string;               // "" initially, e.g., "seller01" once configured
  title: string;             // Storefront headline/title
  description: string;       // Detailed storefront description / bio
  bannerUrl: string;         // URL for hero banner image
  featuredAssetId: string;   // "" if none selected, or ID of featured DigitalAsset
  isVisible: boolean;        // Controls whether selldigitalassets.com/<url> is publicly live
  updatedAt?: string;
}

export type UpdateStorefrontPayload = Omit<SellerStorefrontConfig, "updatedAt">;

