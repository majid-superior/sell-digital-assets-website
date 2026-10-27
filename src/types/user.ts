// src/types/user.ts
export type UserRole =
  | "GUEST"
  | "BUYER"
  | "SELLER"
  | "ADMIN"
  | "STORE_MANAGER"
  | "CONTENT_UPLOADER"
  | "ANALYST"
  | "buyer"
  | "seller"
  | "admin"
  | "guest"
  | "customer"
  | "store_manager"
  | "content_uploader"
  | "analyst";

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
  parent_seller_id?: string | null;
  allowed_permissions?: string[];
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

export interface StoreTeamRole {
  id: number;
  name: string;
  slug: string;
  scope: string;
  description: string;
  allow_public_signup?: boolean;
}

export interface StoreTeamMember {
  id: string;
  name: string;
  display_name?: string;
  email: string;
  role: string;
  role_id: number;
  role_name?: string;
  role_scope?: string;
  parent_seller_id: string;
  status: "active" | "suspended" | "pending" | "deactive";
  allowed_permissions?: string[];
  created_at: string;
  updated_at?: string;
}
