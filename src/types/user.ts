// src/types/user.ts
export type UserRole = "buyer" | "seller" | "admin";

export interface SellerProfile {
    storeName: string;
    headline: string;
    bio: string;
    avatarUrl: string;
    bannerUrl?: string;
    verified: boolean;
    totalSales: number;
    rating: number;
    joinedDate: string;
}

export interface User {
    id: string;
    email: string;
    username?: string;
    displayName: string;
    role: UserRole;
    avatarUrl?: string;
    sellerProfile?: SellerProfile;
    createdAt?: string;
}
