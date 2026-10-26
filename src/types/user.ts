// src/types/user.ts
export type UserRole =
  | "GUEST"
  | "BUYER"
  | "SELLER"
  | "ADMIN"
  | "buyer"
  | "seller"
  | "admin"
  | "guest"
  | "customer";

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
  url: string; // Starts as "" (empty string); set by seller to e.g. "seller01", "seller02"
  email: string;
  displayName: string;
  name?: string;
  role: UserRole;
  roles?: string[];
  role_id?: number;
  avatarUrl?: string;
  bio?: string;
  bannerUrl?: string;
  sellerProfile?: SellerProfile;
  createdAt: string;
  status?: string;
}

export interface AuthSession {
  user: User;
  accessToken: string;
}
