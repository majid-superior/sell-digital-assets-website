// src/services/v1/couponService.ts
import { apiClient } from "../api.ts";
import type {
    Coupon,
    CouponsResponse,
    CreateCouponPayload,
    UpdateCouponPayload,
    ListCouponsParams,
    ValidateCouponPayload,
    ValidateCouponResult,
} from "@/types/coupon.ts";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export function formatCouponDateRange(startsAt: string, endsAt: string): string {
    try {
        const start = new Date(startsAt);
        const end = new Date(endsAt);
        const options: Intl.DateTimeFormatOptions = {
            day: "numeric",
            month: "short",
            year: "numeric",
        };
        return `Valid from ${start.toLocaleDateString("en-US", options)} to ${end.toLocaleDateString("en-US", options)}`;
    } catch {
        return `Valid until ${endsAt}`;
    }
}

export function buildCouponShareMessage(coupon: Coupon, storeUrl?: string): string {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const resolvedUrl = storeUrl || `${origin}/explore`;
    const dateRange = formatCouponDateRange(coupon.starts_at, coupon.ends_at);

    return `Save ${coupon.discount_percent}% on eligible assets with code ${coupon.code}!\n\n${dateRange}.\n\nShop now: ${resolvedUrl}`;
}

export const couponService = {
    /**
     * Fetch seller's coupons with metrics and pagination
     */
    getCoupons: async (params: ListCouponsParams = {}): Promise<CouponsResponse> => {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.set("search", params.search);
        if (params.status && params.status !== "all") queryParams.set("status", params.status);
        if (params.sortBy) queryParams.set("sortBy", params.sortBy);
        if (params.sortOrder) queryParams.set("sortOrder", params.sortOrder);
        if (params.page) queryParams.set("page", String(params.page));
        if (params.limit) queryParams.set("limit", String(params.limit));

        const queryStr = queryParams.toString();
        const url = `/api/v1/coupons${queryStr ? `?${queryStr}` : ""}`;
        return apiClient.get<CouponsResponse>(url);
    },

    /**
     * Retrieve single coupon details by ID
     */
    getCouponById: async (id: string): Promise<Coupon> => {
        const res = await apiClient.get<ApiResponse<Coupon>>(`/api/v1/coupons/${id}`);
        return res.data;
    },

    /**
     * Create a new coupon for the authenticated seller
     */
    createCoupon: async (payload: CreateCouponPayload): Promise<Coupon> => {
        const res = await apiClient.post<ApiResponse<Coupon>>("/api/v1/coupons", payload);
        return res.data;
    },

    /**
     * Update an existing coupon
     */
    updateCoupon: async (id: string, payload: UpdateCouponPayload): Promise<Coupon> => {
        const res = await apiClient.patch<ApiResponse<Coupon>>(`/api/v1/coupons/${id}`, payload);
        return res.data;
    },

    /**
     * Toggle active/inactive status
     */
    toggleStatus: async (id: string, isActive: boolean): Promise<Coupon> => {
        const res = await apiClient.patch<ApiResponse<Coupon>>(`/api/v1/coupons/${id}/status`, {
            isActive,
        });
        return res.data;
    },

    /**
     * Delete an unredeemed coupon
     */
    deleteCoupon: async (id: string): Promise<{ success: boolean; message: string }> => {
        return apiClient.delete<{ success: boolean; message: string }>(`/api/v1/coupons/${id}`);
    },

    /**
     * Validate coupon code against buyer cart items
     */
    validateCoupon: async (payload: ValidateCouponPayload): Promise<ValidateCouponResult> => {
        const res = await apiClient.post<ApiResponse<ValidateCouponResult>>("/api/v1/coupons/validate", payload);
        return res.data;
    },
};
