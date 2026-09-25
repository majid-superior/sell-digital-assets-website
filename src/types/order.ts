// src/types/order.ts
export type LicenseType = "personal" | "commercial" | "extended";

export type OrderStatus = "pending" | "completed" | "refunded" | "failed";

export interface OrderItem {
    assetId: string;
    title: string;
    thumbnailUrl: string;
    licenseType: LicenseType;
    priceCents: number;
    downloadUrl?: string;
    fileFormat: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    buyerId: string;
    buyerEmail: string;
    items: OrderItem[];
    subtotalCents: number;
    discountCents: number;
    totalCents: number;
    currency: string;
    status: OrderStatus;
    createdAt: string;
}
