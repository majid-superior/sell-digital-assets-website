// src/types/asset.ts

export type TierType = "personal" | "commercial" | "extended";
export type AssetStatus = "draft" | "pending" | "under_review" | "needs_update" | "published" | "rejected" | "archived";
export type MediaType = "thumbnail" | "screenshot" | "preview_audio" | "preview_video";

export interface AssetTier {
  id: string;
  asset_id?: string;
  tier_type: TierType;
  price: number | string;
  license_terms_summary?: string;
}

export interface AssetMedia {
  id: string;
  asset_id: string;
  media_type: MediaType;
  storage_key: string;
  display_order: number;
  file_name?: string;
  file_size_bytes?: number;
  mime_type?: string;
  url?: string;
}

export interface AssetFile {
  id: string;
  asset_id: string;
  version: string;
  file_name: string;
  file_size_bytes?: number;
  file_checksum_sha256?: string;
  manifest_tree?: unknown[];
  created_at?: string;
}

export interface DigitalAsset {
  id: string;
  seller_id: string;
  category_id: number;
  title: string;
  slug: string;
  short_description: string;
  full_description: string | null;
  preview_url?: string;
  storage_path?: string;
  status: AssetStatus;
  admin_feedback?: string | null;
  seller_feedback?: string | null;
  reviewed_at?: string | null;
  submitted_at?: string | null;
  thumbnail_url?: string;
  file_count?: number;
  tags: string[];
  technical_specs: Record<string, unknown>;
  view_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  seller?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    storeName?: string;
    headline?: string;
    rating?: number;
    totalSales?: number;
    verified?: boolean;
  };
  tiers: AssetTier[];
  media?: AssetMedia[];
  files?: AssetFile[];
  min_price?: number;

  // Compatibility helpers
  sellerProfile?: import("@/types/user.ts").SellerProfile;
  thumbnailUrl?: string;
  previewUrls?: string[];
  priceCents?: number;
  currency?: string;
  description?: string;
  ratingAverage?: number;
  reviewsCount?: number;
  salesCount?: number;
  fileFormat?: string;
  fileSizeInBytes?: number;
  version?: string;
}

export interface AssetListResponse {
  items: DigitalAsset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Aliases for backward compatibility
export type LicenseType = TierType;
export type AssetCategory = string;
