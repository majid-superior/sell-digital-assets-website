import { describe, it, expect, vi, beforeEach } from "vitest";
import { assetService } from "./assetService.ts";
import { apiClient } from "@/services/api.ts";
import type { DigitalAsset } from "@/types/asset.ts";

//ToDo: Check File: src/services/v1/assetService.test.ts

describe("assetService.getFeaturedAssets Integration & Contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("extracts items array from standard API envelope { success: true, data: [...] }", async () => {
    const mockAsset: Partial<DigitalAsset> = {
      id: "test-asset-1",
      title: "Featured UI Kit",
      slug: "featured-ui-kit",
      status: "published",
      media: [
        {
          id: "m1",
          asset_id: "test-asset-1",
          storage_key: "public/media/thumb.png",
          media_type: "thumbnail",
          url: "https://example.com/thumb.png",
          display_order: 1,
        },
      ],
      tiers: [
        {
          id: "t1",
          tier_type: "personal",
          price: 19,
          license_terms_summary: "Single app",
        },
      ],
    };

    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      success: true,
      data: [mockAsset as DigitalAsset],
      message: "Featured assets retrieved successfully",
    });

    const result = await assetService.getFeaturedAssets();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/assets/featured");
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Featured UI Kit");
  });

  it("handles empty array results safely without throwing", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      success: true,
      data: [],
      message: "Featured assets retrieved successfully",
    });

    const result = await assetService.getFeaturedAssets();
    expect(result).toEqual([]);
  });

  it("handles direct array response payload fallback", async () => {
    const mockAsset: Partial<DigitalAsset> = {
      id: "test-asset-2",
      title: "3D Cyber Asset",
      slug: "3d-cyber-asset",
      status: "published",
    };

    vi.spyOn(apiClient, "get").mockResolvedValueOnce([
      mockAsset as DigitalAsset,
    ]);

    const result = await assetService.getFeaturedAssets();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("3d-cyber-asset");
  });

  it("passes custom limit query parameter when provided", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      success: true,
      data: [],
    });

    await assetService.getFeaturedAssets(6);
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/assets/featured", {
      params: { limit: 6 },
    });
  });

  describe("assetService.getCuratedAssets Integration & Contract", () => {
    it("extracts curated items from API envelope and supports category filtering", async () => {
      const mockCuratedAsset: Partial<DigitalAsset> = {
        id: "curated-asset-1",
        title: "Curated Neon Pack",
        slug: "curated-neon-pack",
        status: "published",
        is_curated: true,
        category: { id: 1, name: "3D Models", slug: "3d-models" },
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        success: true,
        data: [mockCuratedAsset as DigitalAsset],
        message: "Curated assets retrieved successfully",
      });

      const result = await assetService.getCuratedAssets("3d-models", 12);
      expect(apiClient.get).toHaveBeenCalledWith("/api/v1/assets/curated", {
        params: { limit: 12, categorySlug: "3d-models" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].is_curated).toBe(true);
      expect(result[0].title).toBe("Curated Neon Pack");
    });

    it("handles empty curated assets without throwing", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        success: true,
        data: [],
      });

      const result = await assetService.getCuratedAssets();
      expect(apiClient.get).toHaveBeenCalledWith("/api/v1/assets/curated", {
        params: { limit: 24 },
      });
      expect(result).toEqual([]);
    });
  });

  describe("assetService Storefront Endpoints", () => {
    it("getSellerStorefrontConfig normalizes empty initial config with url: '' and isVisible: false", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        url: "",
        title: "",
        description: "",
        bannerUrl: "",
        featuredAssetId: "",
        isVisible: true,
      });

      const config = await assetService.getSellerStorefrontConfig();
      expect(apiClient.get).toHaveBeenCalledWith("/seller/storefront");
      expect(config).toEqual({
        url: "",
        title: "",
        description: "",
        bannerUrl: "",
        featuredAssetId: "",
        isVisible: false,
        updatedAt: undefined,
      });
    });

    it("updateSellerStorefrontConfig sends PUT /seller/storefront and returns updated config", async () => {
      const payload = {
        url: "seller01",
        title: "PixelCraft Studio",
        description: "Premium UI kits and design systems",
        bannerUrl: "https://assets.selldigitalassets.com/banners/store-banner.webp",
        featuredAssetId: "asset-1",
        isVisible: true,
      };

      vi.spyOn(apiClient, "put").mockResolvedValueOnce({
        ...payload,
        updatedAt: "2026-10-26T00:00:00.000Z",
      });

      const updated = await assetService.updateSellerStorefrontConfig(payload);
      expect(apiClient.put).toHaveBeenCalledWith("/seller/storefront", payload);
      expect(updated.url).toBe("seller01");
      expect(updated.isVisible).toBe(true);
    });

    it("getPublicStorefrontByUrl fetches /catalog/storefronts/:sellerUrl", async () => {
      const mockStorefront = {
        sellerId: "seller-id-1",
        url: "seller01",
        displayName: "PixelCraft",
        title: "PixelCraft Studio",
        description: "Premium digital assets",
        bannerUrl: "https://assets.selldigitalassets.com/banners/store-banner.webp",
        isVisible: true,
        featuredAsset: null,
        assets: [],
        rating: 4.9,
        reviewCount: 42,
        joinedAt: "2026-01-01T00:00:00.000Z",
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockStorefront);

      const result = await assetService.getPublicStorefrontByUrl("seller01");
      expect(apiClient.get).toHaveBeenCalledWith("/catalog/storefronts/seller01");
      expect(result.url).toBe("seller01");
      expect(result.isVisible).toBe(true);
    });

    it("uploadStorefrontBanner sends multipart form data to /seller/storefront/banner", async () => {
      const mockBlob = new Blob(["image-bytes"], { type: "image/webp" });
      vi.spyOn(apiClient, "upload").mockResolvedValueOnce({
        success: true,
        data: { url: "/api/v1/storage/download?key=public/media/storefront/banner.webp" },
      });

      const res = await assetService.uploadStorefrontBanner(mockBlob, "my-banner.webp");
      expect(apiClient.upload).toHaveBeenCalledWith(
        "/seller/storefront/banner",
        expect.any(FormData)
      );
      expect(res.url).toBe("/api/v1/storage/download?key=public/media/storefront/banner.webp");
    });
  });
});
