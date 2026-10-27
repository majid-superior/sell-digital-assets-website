import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  couponService,
  formatCouponDateRange,
  buildCouponShareMessage,
} from "./couponService.ts";
import { apiClient } from "@/services/api.ts";
import type { Coupon, CouponsResponse, ValidateCouponResult } from "@/types/coupon.ts";

describe("couponService API client & helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockCoupon: Coupon = {
    id: "coup-1",
    seller_id: "seller-123",
    code: "DESIGN20",
    description: "20% off design assets",
    discount_percent: 20,
    starts_at: "2026-11-01T00:00:00.000Z",
    ends_at: "2026-11-30T23:59:59.000Z",
    usage_limit: 100,
    usage_count: 5,
    is_active: true,
    created_at: "2026-10-27T10:00:00.000Z",
    updated_at: "2026-10-27T10:00:00.000Z",
    status: "active",
  };

  it("fetches coupons with filters via GET /api/v1/coupons", async () => {
    const mockResponse: CouponsResponse = {
      success: true,
      data: [mockCoupon],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      metrics: {
        totalCoupons: 1,
        activeCoupons: 1,
        totalRedemptions: 5,
        totalDiscountAmount: 150.0,
      },
    };

    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockResponse);

    const result = await couponService.getCoupons({
      search: "DESIGN",
      status: "active",
      sortBy: "discount_percent",
      page: 1,
      limit: 20,
    });

    expect(getSpy).toHaveBeenCalledWith(
      "/api/v1/coupons?search=DESIGN&status=active&sortBy=discount_percent&page=1&limit=20",
    );
    expect(result.data.length).toBe(1);
    expect(result.metrics.activeCoupons).toBe(1);
  });

  it("fetches coupon by ID via GET /api/v1/coupons/:id", async () => {
    const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      success: true,
      data: mockCoupon,
    });

    const result = await couponService.getCouponById("coup-1");
    expect(getSpy).toHaveBeenCalledWith("/api/v1/coupons/coup-1");
    expect(result.code).toBe("DESIGN20");
  });

  it("creates a coupon via POST /api/v1/coupons", async () => {
    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      success: true,
      data: mockCoupon,
    });

    const payload = {
      code: "DESIGN20",
      discountPercent: 20,
      startsAt: "2026-11-01T00:00:00.000Z",
      endsAt: "2026-11-30T23:59:59.000Z",
      usageLimit: 100,
    };

    const result = await couponService.createCoupon(payload);
    expect(postSpy).toHaveBeenCalledWith("/api/v1/coupons", payload);
    expect(result.code).toBe("DESIGN20");
  });

  it("updates a coupon via PATCH /api/v1/coupons/:id", async () => {
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValueOnce({
      success: true,
      data: { ...mockCoupon, discount_percent: 25 },
    });

    const result = await couponService.updateCoupon("coup-1", { discountPercent: 25 });
    expect(patchSpy).toHaveBeenCalledWith("/api/v1/coupons/coup-1", { discountPercent: 25 });
    expect(result.discount_percent).toBe(25);
  });

  it("toggles coupon activation status via PATCH /api/v1/coupons/:id/status", async () => {
    const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValueOnce({
      success: true,
      data: { ...mockCoupon, is_active: false, status: "inactive" },
    });

    const result = await couponService.toggleStatus("coup-1", false);
    expect(patchSpy).toHaveBeenCalledWith("/api/v1/coupons/coup-1/status", { isActive: false });
    expect(result.is_active).toBe(false);
  });

  it("deletes a coupon via DELETE /api/v1/coupons/:id", async () => {
    const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValueOnce({
      success: true,
      message: "Coupon deleted",
    });

    const result = await couponService.deleteCoupon("coup-1");
    expect(deleteSpy).toHaveBeenCalledWith("/api/v1/coupons/coup-1");
    expect(result.success).toBe(true);
  });

  it("validates a coupon code against cart items via POST /api/v1/coupons/validate", async () => {
    const mockValResult: ValidateCouponResult = {
      valid: true,
      coupon: {
        id: "coup-1",
        code: "DESIGN20",
        description: "20% off design assets",
        discountPercent: 20,
        sellerId: "seller-123",
        startsAt: "2026-11-01T00:00:00.000Z",
        endsAt: "2026-11-30T23:59:59.000Z",
      },
      eligibleAssetIds: ["asset-1"],
      eligibleSubtotal: 50.0,
      discountAmount: 10.0,
      discountedSubtotal: 40.0,
      overallSubtotal: 50.0,
      finalTotal: 40.0,
      currency: "USD",
    };

    const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      success: true,
      data: mockValResult,
    });

    const payload = {
      code: "DESIGN20",
      items: [{ assetId: "asset-1", price: 50 }],
    };

    const result = await couponService.validateCoupon(payload);
    expect(postSpy).toHaveBeenCalledWith("/api/v1/coupons/validate", payload);
    expect(result.valid).toBe(true);
    expect(result.discountAmount).toBe(10.0);
  });

  it("formats coupon date range properly", () => {
    const range = formatCouponDateRange("2026-11-01T00:00:00.000Z", "2026-11-30T23:59:59.000Z");
    expect(range).toContain("Valid from");
    expect(range).toContain("to");
  });

  it("builds ready-to-share promotional message containing code, percentage, and valid link", () => {
    const message = buildCouponShareMessage(mockCoupon, "https://assetdrop.internal/store/seller1");
    expect(message).toContain("Save 20% on eligible assets with code DESIGN20!");
    expect(message).toContain("Valid from");
    expect(message).toContain("Shop now: https://assetdrop.internal/store/seller1");
  });
});

