// src/services/v1/assetService.ts
import { apiClient } from "@/services/api.ts";
import type { DigitalAsset } from "@/types/asset.ts";

export interface AssetFilterParams {
    category?: string;
    q?: string;
    sort?: "popular" | "newest" | "price_asc" | "price_desc";
    limit?: number;
    page?: number;
}

export interface AssetListResponse {
    items: DigitalAsset[];
    total: number;
    page: number;
    limit: number;
}

class AssetService {
    /**
     * Fetch paginated and filtered digital asset catalog.
     */
    async getAssets(params?: AssetFilterParams): Promise<AssetListResponse> {
        const cleanParams: Record<string, string | number | boolean> = {};
        if (params) {
            if (params.category) cleanParams.category = params.category;
            if (params.q) cleanParams.q = params.q;
            if (params.sort) cleanParams.sort = params.sort;
            if (params.limit !== undefined) cleanParams.limit = params.limit;
            if (params.page !== undefined) cleanParams.page = params.page;
        }
        return apiClient.get<AssetListResponse>("/assets", {
            params: cleanParams,
        });
    }

    /**
     * Retrieve single digital asset by unique URL slug.
     */
    async getAssetBySlug(slug: string): Promise<DigitalAsset> {
        return apiClient.get<DigitalAsset>(`/assets/${encodeURIComponent(slug)}`);
    }

    /**
     * Retrieve curated featured assets for homepage showcase.
     */
    async getFeaturedAssets(): Promise<DigitalAsset[]> {
        return apiClient.get<DigitalAsset[]>("/assets/featured");
    }

    /**
     * Create a new digital asset (Seller role required).
     */
    async createAsset(assetData: Partial<DigitalAsset>): Promise<DigitalAsset> {
        return apiClient.post<DigitalAsset>("/assets", assetData);
    }
}

export const assetService = new AssetService();
export default assetService;
