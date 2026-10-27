// src/services/v1/sellerUserService.ts
import { apiClient } from "../api.ts";
import type { StoreTeamRole, StoreTeamMember, PermissionItem, StoreRolePermissions } from "@/types/user.ts";

export interface CreateTeamMemberPayload {
  name: string;
  email: string;
  password: string;
  roleId?: number;
  role?: string;
  allowedPermissions?: string[];
}

export interface UpdateTeamMemberPayload {
  name?: string;
  roleId?: number;
  role?: string;
  status?: "active" | "suspended" | "deactive" | "pending";
  password?: string;
  allowedPermissions?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const sellerUserService = {
  /**
   * Fetches dynamically defined store roles from the database (scope: SELLER_STORE)
   */
  getStoreRoles: async (): Promise<StoreTeamRole[]> => {
    const res = await apiClient.get<ApiResponse<StoreTeamRole[]>>("/api/v1/seller/users/roles");
    return res.data || [];
  },

  /**
   * Fetches all team members assigned to the authenticated seller's store
   */
  getTeamMembers: async (): Promise<StoreTeamMember[]> => {
    const res = await apiClient.get<ApiResponse<StoreTeamMember[]>>("/api/v1/seller/users");
    return res.data || [];
  },

  /**
   * Provisions or associates a team member with the seller's store
   */
  createTeamMember: async (payload: CreateTeamMemberPayload): Promise<StoreTeamMember> => {
    const res = await apiClient.post<ApiResponse<StoreTeamMember>>("/api/v1/seller/users", payload);
    return res.data;
  },

  /**
   * Updates an existing store team member's role, status, or details
   */
  updateTeamMember: async (
    id: string,
    payload: UpdateTeamMemberPayload,
  ): Promise<StoreTeamMember> => {
    const res = await apiClient.patch<ApiResponse<StoreTeamMember>>(
      `/api/v1/seller/users/${id}`,
      payload,
    );
    return res.data;
  },

  /**
   * Removes a team member from the seller's store team
   */
  deleteTeamMember: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/api/v1/seller/users/${id}`);
  },

  /**
   * Fetches the global catalog of store permissions
   */
  getPermissionsCatalog: async (): Promise<PermissionItem[]> => {
    const res = await apiClient.get<ApiResponse<PermissionItem[]>>(
      "/api/v1/seller/users/permissions",
    );
    return res.data || [];
  },

  /**
   * Fetches the current role-level permissions configured for the seller's store
   */
  getRolePermissions: async (): Promise<StoreRolePermissions[]> => {
    const res = await apiClient.get<ApiResponse<StoreRolePermissions[]>>(
      "/api/v1/seller/users/roles/permissions",
    );
    return res.data || [];
  },

  /**
   * Updates/customizes permissions assigned to a store role for the seller's store
   */
  updateRolePermissions: async (
    roleId: number,
    permissions: string[],
  ): Promise<StoreRolePermissions> => {
    const res = await apiClient.put<ApiResponse<StoreRolePermissions>>(
      `/api/v1/seller/users/roles/${roleId}/permissions`,
      { permissions },
    );
    return res.data;
  },
};
