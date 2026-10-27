export type CouponStatus = "active" | "inactive" | "scheduled" | "expired";

export interface Coupon {
    id: string;
    seller_id: string;
    code: string;
    description: string | null;
    discount_percent: number;
    starts_at: string;
    ends_at: string;
    usage_limit: number | null;
    usage_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    status: CouponStatus;
    seller?: {
        id: string;
        name: string;
        email?: string;
    };
}

export interface CouponMetrics {
    totalCoupons: number;
    activeCoupons: number;
    totalRedemptions: number;
    totalDiscountAmount: number;
}

export interface CouponPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CouponsResponse {
    success: boolean;
    data: Coupon[];
    pagination: CouponPagination;
    metrics: CouponMetrics;
}

export interface CreateCouponPayload {
    code: string;
    description?: string | null;
    discountPercent: number;
    startsAt: string;
    endsAt: string;
    usageLimit?: number | null;
    isActive?: boolean;
}

export interface UpdateCouponPayload {
    description?: string | null;
    discountPercent?: number;
    startsAt?: string;
    endsAt?: string;
    usageLimit?: number | null;
    isActive?: boolean;
}

export interface ListCouponsParams {
    search?: string;
    status?: CouponStatus | "all";
    sortBy?: "created_at" | "code" | "discount_percent" | "ends_at" | "usage_count";
    sortOrder?: "asc" | "desc";
    page?: number;
    limit?: number;
}

export interface CartItemValidationInput {
    assetId: string;
    price?: number;
    tierType?: "personal" | "commercial" | "extended";
}

export interface ValidateCouponPayload {
    code: string;
    items: CartItemValidationInput[];
}

export interface ValidateCouponResult {
    valid: boolean;
    coupon: {
        id: string;
        code: string;
        description: string | null;
        discountPercent: number;
        sellerId: string;
        startsAt: string;
        endsAt: string;
    };
    eligibleAssetIds: string[];
    eligibleSubtotal: number;
    discountAmount: number;
    discountedSubtotal: number;
    overallSubtotal: number;
    finalTotal: number;
    currency: string;
}
