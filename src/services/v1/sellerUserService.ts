// src/services/v1/sellerUserService.ts
import { apiClient } from "../api.ts";
import type {
  StoreTeamRole,
  StoreTeamMember,
  PermissionItem,
  StoreRolePermissions,
  CreateRolePayload,
  RoleMatrixUpdate,
} from "@/types/user.ts";

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
  getStoreRoles: async (includeInactive = false): Promise<StoreTeamRole[]> => {
    const endpoint = includeInactive
      ? "/api/v1/seller/users/roles?includeInactive=true"
      : "/api/v1/seller/users/roles";
    const res = await apiClient.get<ApiResponse<StoreTeamRole[]> | StoreTeamRole[]>(endpoint);
    if (Array.isArray(res)) return res;
    return Array.isArray(res?.data) ? res.data : [];
  },

  /**
   * Fetches all team members assigned to the authenticated seller's store
   */
  getTeamMembers: async (): Promise<StoreTeamMember[]> => {
    const res = await apiClient.get<ApiResponse<StoreTeamMember[]> | StoreTeamMember[]>("/api/v1/seller/users");
    if (Array.isArray(res)) return res;
    return Array.isArray(res?.data) ? res.data : [];
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
    const res = await apiClient.get<ApiResponse<PermissionItem[]> | PermissionItem[]>(
      "/api/v1/seller/users/permissions",
    );
    if (Array.isArray(res)) return res;
    return Array.isArray(res?.data) ? res.data : [];
  },

  /**
   * Fetches the current role-level permissions configured for the seller's store
   */
  getRolePermissions: async (includeInactive = false): Promise<StoreRolePermissions[]> => {
    const endpoint = includeInactive
      ? "/api/v1/seller/users/roles/permissions?includeInactive=true"
      : "/api/v1/seller/users/roles/permissions";
    const res = await apiClient.get<ApiResponse<StoreRolePermissions[]> | StoreRolePermissions[]>(endpoint);
    if (Array.isArray(res)) return res;
    return Array.isArray(res?.data) ? res.data : [];
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

  /**
   * Atomically saves permission sets across multiple roles in a single request
   */
  updateRolePermissionsMatrix: async (
    matrix: RoleMatrixUpdate[],
  ): Promise<StoreRolePermissions[]> => {
    const res = await apiClient.put<ApiResponse<StoreRolePermissions[]> | StoreRolePermissions[]>(
      "/api/v1/seller/users/roles/permissions",
      { matrix },
    );
    if (Array.isArray(res)) return res;
    return Array.isArray(res?.data) ? res.data : [];
  },

  /**
   * Creates a new store role or reactivates an existing inactive role
   */
  createStoreRole: async (payload: CreateRolePayload): Promise<StoreTeamRole> => {
    const res = await apiClient.post<ApiResponse<StoreTeamRole>>(
      "/api/v1/seller/users/roles",
      payload,
    );
    return res.data;
  },

  /**
   * Activates or deactivates a store role
   */
  updateStoreRoleStatus: async (
    roleId: number,
    isActive: boolean,
  ): Promise<StoreTeamRole> => {
    const res = await apiClient.patch<ApiResponse<StoreTeamRole>>(
      `/api/v1/seller/users/roles/${roleId}/status`,
      { is_active: isActive },
    );
    return res.data;
  },
};
