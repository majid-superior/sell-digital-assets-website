import { describe, it, expect, vi, beforeEach } from "vitest";
import { sellerUserService } from "./sellerUserService.ts";
import { apiClient } from "@/services/api.ts";
import type { StoreTeamRole, StoreTeamMember } from "@/types/user.ts";

describe("sellerUserService API client contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockRoles: StoreTeamRole[] = [
    {
      id: 4,
      name: "Manager",
      slug: "manager",
      scope: "SELLER_STORE",
      description: "Full store management access except store transfer",
    },
    {
      id: 5,
      name: "User",
      slug: "user",
      scope: "SELLER_STORE",
      description: "Draft and upload digital products",
    },
    {
      id: 6,
      name: "Analyst",
      slug: "analyst",
      scope: "SELLER_STORE",
      description: "Read-only access to sales and analytics",
    },
  ];

  const mockMembers: StoreTeamMember[] = [
    {
      id: "mem-1",
      name: "Alice Cooper",
      email: "alice@store.internal",
      role: "manager",
      role_id: 4,
      role_name: "Manager",
      parent_seller_id: "seller-123",
      status: "active",
      created_at: new Date().toISOString(),
    },
  ];

  it("fetches store roles dynamically via GET /api/v1/seller/users/roles", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      success: true,
      data: mockRoles,
    });

    const roles = await sellerUserService.getStoreRoles();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/seller/users/roles");
    expect(roles).toHaveLength(3);
    expect(roles[0].slug).toBe("manager");
    expect(roles[1].slug).toBe("user");
    expect(roles[2].slug).toBe("analyst");
  });

  it("fetches store team members via GET /api/v1/seller/users", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      success: true,
      data: mockMembers,
    });

    const members = await sellerUserService.getTeamMembers();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/seller/users");
    expect(members).toHaveLength(1);
    expect(members[0].name).toBe("Alice Cooper");
    expect(members[0].status).toBe("active");
  });

  it("creates a new store team member via POST /api/v1/seller/users", async () => {
    const payload = {
      name: "Bob Builder",
      email: "bob@store.internal",
      password: "SecretPassword123!",
      roleId: 5,
    };

    const createdMember: StoreTeamMember = {
      id: "mem-2",
      name: payload.name,
      email: payload.email,
      role: "user",
      role_id: 5,
      role_name: "User",
      parent_seller_id: "seller-123",
      status: "active",
      created_at: new Date().toISOString(),
    };

    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      success: true,
      data: createdMember,
    });

    const result = await sellerUserService.createTeamMember(payload);
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/seller/users", payload);
    expect(result.id).toBe("mem-2");
    expect(result.role).toBe("user");
  });

  it("updates an existing store team member via PATCH /api/v1/seller/users/:id", async () => {
    const updatePayload = {
      name: "Alice Updated",
      status: "suspended" as const,
    };

    const updatedMember: StoreTeamMember = {
      ...mockMembers[0],
      name: "Alice Updated",
      status: "suspended",
    };

    vi.spyOn(apiClient, "patch").mockResolvedValueOnce({
      success: true,
      data: updatedMember,
    });

    const result = await sellerUserService.updateTeamMember("mem-1", updatePayload);
    expect(apiClient.patch).toHaveBeenCalledWith("/api/v1/seller/users/mem-1", updatePayload);
    expect(result.name).toBe("Alice Updated");
    expect(result.status).toBe("suspended");
  });

  it("deletes a store team member via DELETE /api/v1/seller/users/:id", async () => {
    vi.spyOn(apiClient, "delete").mockResolvedValueOnce({
      success: true,
      data: undefined,
    });

    await sellerUserService.deleteTeamMember("mem-1");
    expect(apiClient.delete).toHaveBeenCalledWith("/api/v1/seller/users/mem-1");
  });

  it("fetches permissions catalog via GET /api/v1/seller/users/permissions", async () => {
    const mockCatalog = [
      {
        id: 1,
        name: "analytics:view",
        module: "analytics",
        action: "view",
        description: "View store metrics",
        scope: "seller",
      },
      {
        id: 2,
        name: "products:view",
        module: "products",
        action: "view",
        description: "View products",
        scope: "seller",
      },
    ];

    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      success: true,
      data: mockCatalog,
    });

    const result = await sellerUserService.getPermissionsCatalog();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/seller/users/permissions");
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("analytics:view");
  });

  it("fetches role permissions via GET /api/v1/seller/users/roles/permissions", async () => {
    const mockRolePerms = [
      {
        roleId: 6,
        roleName: "Analyst",
        roleSlug: "analyst",
        description: "Read-only analytics",
        isCustomized: false,
        permissions: ["analytics:view", "products:view", "orders:view"],
      },
    ];

    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      success: true,
      data: mockRolePerms,
    });

    const result = await sellerUserService.getRolePermissions();
    expect(apiClient.get).toHaveBeenCalledWith("/api/v1/seller/users/roles/permissions");
    expect(result).toHaveLength(1);
    expect(result[0].roleSlug).toBe("analyst");
    expect(result[0].permissions).toContain("analytics:view");
  });

  it("updates role permissions via PUT /api/v1/seller/users/roles/:roleId/permissions", async () => {
    const updatedPerms = {
      roleId: 6,
      roleName: "Analyst",
      roleSlug: "analyst",
      description: "Read-only analytics",
      isCustomized: true,
      permissions: ["analytics:view", "products:view", "orders:view", "products:create"],
    };

    vi.spyOn(apiClient, "put").mockResolvedValueOnce({
      success: true,
      data: updatedPerms,
    });

    const result = await sellerUserService.updateRolePermissions(6, [
      "analytics:view",
      "products:view",
      "orders:view",
      "products:create",
    ]);

    expect(apiClient.put).toHaveBeenCalledWith(
      "/api/v1/seller/users/roles/6/permissions",
      { permissions: ["analytics:view", "products:view", "orders:view", "products:create"] },
    );
    expect(result.isCustomized).toBe(true);
    expect(result.permissions).toContain("products:create");
  });

  it("handles raw non-enveloped array payloads gracefully", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockRoles);

    const roles = await sellerUserService.getStoreRoles();
    expect(roles).toHaveLength(3);
    expect(roles[0].slug).toBe("manager");
  });

  it("handles unexpected null or non-array responses gracefully by returning an empty array", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValueOnce({
      success: true,
      data: null,
    });

    const roles = await sellerUserService.getStoreRoles();
    expect(roles).toEqual([]);
  });

  it("creates a new store role via POST /api/v1/seller/users/roles", async () => {
    const payload = {
      name: "Content Editor",
      description: "Manage product descriptions and images",
      permissions: ["products:view", "products:edit"],
    };
    const createdRole: StoreTeamRole = {
      id: 7,
      name: payload.name,
      slug: "content_editor",
      scope: "SELLER_STORE",
      description: payload.description,
      is_active: true,
    };
    vi.spyOn(apiClient, "post").mockResolvedValueOnce({
      success: true,
      data: createdRole,
    });

    const res = await sellerUserService.createStoreRole(payload);
    expect(apiClient.post).toHaveBeenCalledWith("/api/v1/seller/users/roles", payload);
    expect(res.name).toBe("Content Editor");
    expect(res.id).toBe(7);
  });

  it("toggles role status via PATCH /api/v1/seller/users/roles/:roleId/status", async () => {
    vi.spyOn(apiClient, "patch").mockResolvedValueOnce({
      success: true,
      data: { id: 7, name: "Content Editor", is_active: false },
    });

    const res = await sellerUserService.updateStoreRoleStatus(7, false);
    expect(apiClient.patch).toHaveBeenCalledWith(
      "/api/v1/seller/users/roles/7/status",
      { is_active: false },
    );
    expect(res.is_active).toBe(false);
  });

  it("batch updates permissions matrix via PUT /api/v1/seller/users/roles/permissions", async () => {
    const matrix = [
      { roleId: 4, permissions: ["analytics:view", "products:view"] },
      { roleId: 5, permissions: ["products:view"] },
    ];
    vi.spyOn(apiClient, "put").mockResolvedValueOnce({
      success: true,
      data: [
        { roleId: 4, permissions: ["analytics:view", "products:view"] },
        { roleId: 5, permissions: ["products:view"] },
      ],
    });

    const res = await sellerUserService.updateRolePermissionsMatrix(matrix);
    expect(apiClient.put).toHaveBeenCalledWith(
      "/api/v1/seller/users/roles/permissions",
      { matrix },
    );
    expect(res).toHaveLength(2);
  });
});
