// src/types/asset.ts
export type AssetCategory = "ui_kit" | "font" | "3d_model" | "template" | "icon_set";

export type AssetStatus = "draft" | "published" | "archived";

export type LicenseType = "personal" | "commercial" | "extended";

export interface DigitalAsset {
    id: string;
    sellerId: string;
    title: string;
    slug: string;
    description: string;
    priceCents: number;
    currency: string;
    category: AssetCategory;
    tags: string[];
    thumbnailUrl: string;
    previewUrls: string[];
    fileSizeInBytes: number;
    fileFormat: string;
    version: string;
    ratingAverage: number;
    reviewsCount: number;
    salesCount: number;
    status: AssetStatus;
    createdAt: string;
    updatedAt: string;
    seller?: import("@/types/user.ts").SellerProfile;
    sellerProfile?: import("@/types/user.ts").SellerProfile;
}
