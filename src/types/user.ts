// src/types/user.ts
export type UserRole =
  | "GUEST"
  | "BUYER"
  | "SELLER"
  | "ADMIN"
  | "MANAGER"
  | "USER"
  | "STORE_MANAGER"
  | "CONTENT_UPLOADER"
  | "ANALYST"
  | "buyer"
  | "seller"
  | "admin"
  | "guest"
  | "customer"
  | "manager"
  | "user"
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
  permissions?: string[];
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
  is_active?: boolean;
  is_system?: boolean;
  created_at?: string;
}

export interface PermissionItem {
  id: number;
  name: string;
  module: string;
  action: string;
  description: string;
  scope: string;
}

export interface StoreRolePermissions {
  roleId: number;
  roleName: string;
  roleSlug: string;
  description: string;
  isCustomized: boolean;
  is_active?: boolean;
  permissions: string[];
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions?: string[];
  reactivateIfExists?: boolean;
}

export interface UpdateRoleStatusPayload {
  is_active: boolean;
}

export interface RoleMatrixUpdate {
  roleId: number;
  permissions: string[];
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
  permissions?: string[];
  created_at: string;
  updated_at?: string;
}
