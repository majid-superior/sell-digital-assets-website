// src/features/dashboard/pages/seller/PermissionsPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/Button.tsx";
import { Badge } from "@/components/ui/Badge.tsx";
import { Checkbox } from "@/components/ui/Checkbox.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card.tsx";
import { Modal } from "@/components/ui/Modal.tsx";
import { Skeleton } from "@/components/ui/Skeleton.tsx";
import { Spinner } from "@/components/ui/Spinner.tsx";
import { EmptyState } from "@/components/ui/EmptyState.tsx";
import { sellerUserService } from "@/services/v1/sellerUserService.ts";
import type { PermissionItem, StoreTeamRole } from "@/types/user.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { getHumanErrorMessage } from "@/utils/errors.ts";

const DEFAULT_ROLE_PERMS: Record<number, string[]> = {
  4: [
    "analytics:view",
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    "products:publish",
    "coupons:view",
    "coupons:manage",
    "orders:view",
    "financial:view",
    "storefront:view",
    "storefront:edit",
    "team:view",
    "team:manage",
    "settings:view",
    "settings:edit",
  ],
  5: [
    "analytics:view",
    "products:view",
    "products:create",
    "products:edit",
    "products:publish",
  ],
  6: [
    "analytics:view",
    "products:view",
    "orders:view",
  ],
};

interface ModuleMeta {
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const MODULE_META: Record<string, ModuleMeta> = {
  analytics: {
    label: "Analytics & Reports",
    description: "Store traffic, sales metrics, and performance analytics",
    icon: Icons.BarChart3,
  },
  products: {
    label: "Products & Digital Assets",
    description: "Creating, editing, cataloging, and publishing digital goods",
    icon: Icons.Package,
  },
  coupons: {
    label: "Coupons & Discounts",
    description: "Promotional campaigns, discount codes, and special offers",
    icon: Icons.Tag,
  },
  orders: {
    label: "Orders & Purchases",
    description: "Order listings, fulfillment records, and customer purchase histories",
    icon: Icons.ShoppingBag,
  },
  financial: {
    label: "Financial & Payouts",
    description: "Access to store balance, revenue breakdowns, and withdrawal records",
    icon: Icons.Wallet,
  },
  storefront: {
    label: "Storefront & Branding",
    description: "Store profile, custom banners, branding assets, and display rules",
    icon: Icons.Store,
  },
  team: {
    label: "Team Management",
    description: "Team collaborator provisioning, roles, and status administration",
    icon: Icons.Users,
  },
  settings: {
    label: "Store Settings",
    description: "General store preferences, notification alerts, and policies",
    icon: Icons.Settings,
  },
};

const getActionBadgeVariant = (action: string) => {
  switch (action.toLowerCase()) {
    case "view":
      return "outline" as const;
    case "create":
      return "success" as const;
    case "edit":
      return "primary" as const;
    case "delete":
      return "error" as const;
    case "publish":
      return "warning" as const;
    case "manage":
      return "secondary" as const;
    default:
      return "default" as const;
  }
};

export const PermissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const {
    data: allRoles = [],
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    error: rolesError,
  } = useQuery({
    queryKey: queryKeys.sellerUsers.roles(true),
    queryFn: () => sellerUserService.getStoreRoles(true),
  });

  const {
    data: permissionsCatalog = [],
    isLoading: isLoadingCatalog,
    isError: isErrorCatalog,
    error: catalogError,
  } = useQuery({
    queryKey: queryKeys.sellerUsers.permissionsCatalog(),
    queryFn: () => sellerUserService.getPermissionsCatalog(),
  });

  const {
    data: rolePermissions = [],
    isLoading: isLoadingRolePerms,
    isError: isErrorRolePerms,
    error: rolePermsError,
  } = useQuery({
    queryKey: queryKeys.sellerUsers.rolePermissions(true),
    queryFn: () => sellerUserService.getRolePermissions(true),
  });

  const { data: members = [] } = useQuery({
    queryKey: queryKeys.sellerUsers.list(),
    queryFn: () => sellerUserService.getTeamMembers(),
  });

  const isLoading = isLoadingRoles || isLoadingCatalog || isLoadingRolePerms;

  // Active vs Inactive roles
  const activeRoles = useMemo(
    () => allRoles.filter((r) => r.is_active !== false),
    [allRoles],
  );
  const inactiveRoles = useMemo(
    () => allRoles.filter((r) => r.is_active === false),
    [allRoles],
  );

  // Group permissions logically by module
  const permissionsByModule = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    for (const p of permissionsCatalog) {
      if (!map[p.module]) {
        map[p.module] = [];
      }
      map[p.module].push(p);
    }
    return map;
  }, [permissionsCatalog]);

  // Toast notifications on query errors
  useEffect(() => {
    if (isErrorRoles) {
      toast.error("Failed to load store roles", {
        description: getHumanErrorMessage(rolesError, "Unable to load roles."),
      });
    }
  }, [isErrorRoles, rolesError]);

  useEffect(() => {
    if (isErrorCatalog) {
      toast.error("Failed to load permissions catalog", {
        description: getHumanErrorMessage(catalogError, "Unable to load permissions."),
      });
    }
  }, [isErrorCatalog, catalogError]);

  useEffect(() => {
    if (isErrorRolePerms) {
      toast.error("Failed to load configured role permissions", {
        description: getHumanErrorMessage(rolePermsError, "Unable to load role permissions."),
      });
    }
  }, [isErrorRolePerms, rolePermsError]);

  // Draft permission matrix state: roleId -> array of permission names
  const [draftPermissions, setDraftPermissions] = useState<Record<number, string[]>>({});

  // Helper to obtain current permissions for a role (draft with fallback to server)
  const getRoleEffectivePermissions = (roleId: number): string[] => {
    if (draftPermissions[roleId] !== undefined) {
      return draftPermissions[roleId];
    }
    const serverConf = rolePermissions.find((rp) => rp.roleId === roleId);
    return serverConf?.permissions ?? DEFAULT_ROLE_PERMS[roleId] ?? [];
  };

  // Check if a role is modified compared to server
  const isRoleModified = React.useCallback(
    (roleId: number): boolean => {
      if (draftPermissions[roleId] === undefined) return false;
      const serverConf = rolePermissions.find((rp) => rp.roleId === roleId);
      const serverPerms = serverConf?.permissions ?? DEFAULT_ROLE_PERMS[roleId] ?? [];
      const drafted = draftPermissions[roleId];
      if (serverPerms.length !== drafted.length) return true;
      const setA = new Set(serverPerms);
      return drafted.some((p) => !setA.has(p));
    },
    [draftPermissions, rolePermissions],
  );

  // Determine if matrix has unsaved changes
  const modifiedRoleIds = useMemo(() => {
    return activeRoles.map((r) => r.id).filter((id) => isRoleModified(id));
  }, [activeRoles, isRoleModified]);

  const isDirty = modifiedRoleIds.length > 0;

  // Save changes mutation
  const saveMatrixMutation = useMutation({
    mutationFn: (matrix: Array<{ roleId: number; permissions: string[] }>) =>
      sellerUserService.updateRolePermissionsMatrix(matrix),
    onSuccess: (updatedConfigs) => {
      setDraftPermissions({});
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellerUsers.all });
      toast.success("Permissions saved successfully", {
        description: `Persisted changes for ${updatedConfigs.length} store roles.`,
      });
    },
    onError: (err: unknown) => {
      toast.error("Failed to save permissions", {
        description: getHumanErrorMessage(err, "An error occurred while saving the permission matrix."),
      });
    },
  });

  // Toggle single permission for a role
  const handleTogglePermission = (roleId: number, permName: string) => {
    const current = getRoleEffectivePermissions(roleId);
    const exists = current.includes(permName);
    const updated = exists ? current.filter((p) => p !== permName) : [...current, permName];
    setDraftPermissions((prev) => ({
      ...prev,
      [roleId]: updated,
    }));
  };

  // Toggle all permissions in a module for a role
  const handleToggleModuleForRole = (roleId: number, modulePermNames: string[]) => {
    const current = getRoleEffectivePermissions(roleId);
    const allModuleActive = modulePermNames.every((p) => current.includes(p));
    let updated: string[];
    if (allModuleActive) {
      updated = current.filter((p) => !modulePermNames.includes(p));
    } else {
      updated = Array.from(new Set([...current, ...modulePermNames]));
    }
    setDraftPermissions((prev) => ({
      ...prev,
      [roleId]: updated,
    }));
  };

  // Grant or revoke all catalog permissions for a role
  const handleToggleRoleAll = (roleId: number) => {
    const current = getRoleEffectivePermissions(roleId);
    const allCatalogNames = permissionsCatalog.map((p) => p.name);
    const hasAll = allCatalogNames.every((p) => current.includes(p));
    setDraftPermissions((prev) => ({
      ...prev,
      [roleId]: hasAll ? [] : [...allCatalogNames],
    }));
  };

  // Reset a role to default preset
  const handleResetRoleDefaults = (roleId: number) => {
    const defaults = DEFAULT_ROLE_PERMS[roleId] ?? [];
    setDraftPermissions((prev) => ({
      ...prev,
      [roleId]: defaults,
    }));
    toast.info("Default preset applied to draft", {
      description: "Click 'Save Changes' to persist.",
    });
  };

  // Discard all unsaved draft changes
  const handleDiscardAll = () => {
    setDraftPermissions({});
    toast.info("Unsaved changes discarded", {
      description: "Reverted permission matrix to active server configuration.",
    });
  };

  // Submit all modified roles to server
  const handleSaveMatrix = () => {
    if (!isDirty) return;
    const matrix = modifiedRoleIds.map((roleId) => ({
      roleId,
      permissions: getRoleEffectivePermissions(roleId),
    }));
    saveMatrixMutation.mutate(matrix);
  };

  // Add Role Modal state
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [cloneFromRoleId, setCloneFromRoleId] = useState<string>("none");
  const [inactiveConflictRole, setInactiveConflictRole] = useState<StoreTeamRole | null>(null);

  const handleOpenAddRoleModal = () => {
    setNewRoleName("");
    setNewRoleDescription("");
    setCloneFromRoleId("none");
    setInactiveConflictRole(null);
    setIsAddRoleModalOpen(true);
  };

  const handleCloseAddRoleModal = () => {
    setIsAddRoleModalOpen(false);
    setNewRoleName("");
    setNewRoleDescription("");
    setCloneFromRoleId("none");
    setInactiveConflictRole(null);
  };

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      description?: string;
      permissions?: string[];
      reactivateIfExists?: boolean;
    }) => sellerUserService.createStoreRole(payload),
    onSuccess: (newRole) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellerUsers.all });
      toast.success("Role created successfully", {
        description: `${newRole.name} has been added to your store roles matrix.`,
      });
      handleCloseAddRoleModal();
    },
    onError: (err: unknown) => {
      // Check if server indicated an inactive role conflict
      const errorObj = err && typeof err === "object" ? (err as Record<string, unknown>) : null;
      const errData =
        errorObj && typeof errorObj.data === "object" && errorObj.data !== null
          ? (errorObj.data as { code?: string; existingRole?: StoreTeamRole })
          : undefined;
      const rawMsg =
        errorObj && typeof errorObj.message === "string" ? errorObj.message : "";
      if (errData?.code === "INACTIVE_ROLE_EXISTS" || rawMsg.toLowerCase().includes("inactive role")) {
        const found =
          errData?.existingRole ||
          inactiveRoles.find((r) => r.name.toLowerCase() === newRoleName.trim().toLowerCase());
        if (found) {
          setInactiveConflictRole(found);
          return;
        }
      }
      toast.error("Role creation failed", {
        description: getHumanErrorMessage(err, "Unable to create role."),
      });
    },
  });

  const handleSubmitCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRoleName.trim();
    if (!trimmed) {
      toast.error("Role name required", {
        description: "Please enter a role name.",
      });
      return;
    }

    // Client-side preflight duplicate check
    const normalized = trimmed.toLowerCase();
    const activeDup = activeRoles.find(
      (r) => r.name.toLowerCase() === normalized || r.slug.toLowerCase() === normalized,
    );
    if (activeDup) {
      toast.error("Role already exists", {
        description: `An active store role named '${activeDup.name}' is already present in your matrix.`,
      });
      return;
    }

    const inactiveDup = inactiveRoles.find(
      (r) => r.name.toLowerCase() === normalized || r.slug.toLowerCase() === normalized,
    );
    if (inactiveDup) {
      setInactiveConflictRole(inactiveDup);
      return;
    }

    let initialPerms: string[] | undefined;
    if (cloneFromRoleId !== "none") {
      const sourceRoleId = Number(cloneFromRoleId);
      initialPerms = getRoleEffectivePermissions(sourceRoleId);
    }

    createRoleMutation.mutate({
      name: trimmed,
      description: newRoleDescription.trim() || undefined,
      permissions: initialPerms,
    });
  };

  const handleReactivateConflictRole = () => {
    if (!inactiveConflictRole) return;
    createRoleMutation.mutate({
      name: inactiveConflictRole.name,
      reactivateIfExists: true,
    });
  };

  // Role Status Mutation (Activate / Deactivate)
  const [roleToDeactivate, setRoleToDeactivate] = useState<StoreTeamRole | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: ({ roleId, isActive }: { roleId: number; isActive: boolean }) =>
      sellerUserService.updateStoreRoleStatus(roleId, isActive),
    onSuccess: (updatedRole) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellerUsers.all });
      toast.success(
        updatedRole.is_active ? "Role reactivated" : "Role deactivated",
        {
          description: updatedRole.is_active
            ? `${updatedRole.name} has been restored to the active matrix.`
            : `${updatedRole.name} was deactivated and hidden. All saved permissions remain preserved.`,
        },
      );
      setRoleToDeactivate(null);
    },
    onError: (err: unknown) => {
      toast.error("Role status update failed", {
        description: getHumanErrorMessage(err, "Unable to update role status."),
      });
    },
  });

  // Inactive Roles Drawer / Modal state
  const [isInactiveModalOpen, setIsInactiveModalOpen] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* ===================================================================== */}
      {/* Page Header */}
      {/* ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Role-Based Permission Matrix
            </h1>
            <Badge variant="outline" size="sm" className="text-xs">
              {activeRoles.length} Active {activeRoles.length === 1 ? "Role" : "Roles"}
            </Badge>
            {inactiveRoles.length > 0 && (
              <Badge variant="secondary" size="sm" className="text-xs">
                {inactiveRoles.length} Inactive
              </Badge>
            )}
          </div>
          <p className="text-sm text-on-surface-variant mt-1.5 max-w-3xl leading-relaxed">
            Centralized matrix mapping operational capabilities across active store team roles.
            Columns are generated dynamically from active database roles; inactive role permissions
            remain securely locked and preserved in the database.
          </p>
        </div>

        {/* Global Page Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAddRoleModal}
            className="text-xs h-9 cursor-pointer gap-1.5 font-medium"
          >
            <Icons.Plus size={15} />
            <span>Add Role</span>
          </Button>

          {inactiveRoles.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInactiveModalOpen(true)}
              className="text-xs h-9 cursor-pointer gap-1.5 font-medium"
            >
              <Icons.EyeOff size={15} />
              <span>Inactive Roles ({inactiveRoles.length})</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/seller/users/roles")}
            className="text-xs h-9 cursor-pointer gap-1.5 font-medium"
          >
            <Icons.Shield size={14} />
            <span>Role Directory</span>
          </Button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* Sticky Unsaved Changes Bar */}
      {/* ===================================================================== */}
      {isDirty && (
        <div className="sticky top-16 z-20 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:px-5 rounded-2xl bg-surface-container-high/90 border border-primary/40 backdrop-blur-md shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="font-semibold text-on-surface">Unsaved Matrix Changes:</span>
            <span className="text-on-surface-variant">
              Modifications across {modifiedRoleIds.length}{" "}
              {modifiedRoleIds.length === 1 ? "role" : "roles"}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardAll}
              disabled={saveMatrixMutation.isPending}
              className="text-xs h-8 cursor-pointer flex-1 sm:flex-initial"
            >
              Discard Changes
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={handleSaveMatrix}
              disabled={saveMatrixMutation.isPending}
              className="text-xs h-8 flex items-center gap-1.5 cursor-pointer shadow-xs flex-1 sm:flex-initial"
            >
              {saveMatrixMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Icons.Check size={14} />
                  <span>Save Matrix Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* Loading Skeleton */}
      {/* ===================================================================== */}
      {isLoading ? (
        <div className="space-y-4">
          <Card className="p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3 pt-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      ) : activeRoles.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<Icons.Shield size={32} className="text-primary" />}
          title="No Active Roles Available"
          description={
            inactiveRoles.length > 0
              ? `All ${inactiveRoles.length} store roles are currently deactivated. Reactivate a role to view and edit its permissions matrix.`
              : "No assignable store roles were found. Create a new store role to configure permissions."
          }
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={handleOpenAddRoleModal}>
                <Icons.Plus size={14} className="mr-1.5" />
                <span>Create Role</span>
              </Button>
              {inactiveRoles.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setIsInactiveModalOpen(true)}>
                  <span>View Inactive Roles</span>
                </Button>
              )}
            </div>
          }
        />
      ) : (
        /* ===================================================================== */
        /* SINGLE-PAGE ROLE-BASED PERMISSION MATRIX */
        /* ===================================================================== */
        <div className="space-y-6">
          {/* Desktop & Tablet Matrix Grid (Prohibits horizontal overflow via responsive layout) */}
          <div className="hidden md:block rounded-2xl border border-outline-variant/30 bg-surface shadow-xs overflow-hidden">
            <div className="overflow-x-auto w-full overscroll-x-contain">
              <table className="w-full text-left border-collapse table-fixed">
                {/* Dynamic Table Header */}
                <thead>
                  <tr className="bg-surface-container-high/60 border-b border-outline-variant/30 text-xs">
                    <th scope="col" className="w-[38%] min-w-[280px] p-4 text-on-surface font-bold tracking-tight">
                      <div className="flex items-center gap-2">
                        <Icons.KeyRound size={15} className="text-primary" />
                        <span>Permission Definition</span>
                      </div>
                    </th>

                    {/* Dynamic Role Columns */}
                    {activeRoles.map((role) => {
                      const effective = getRoleEffectivePermissions(role.id);
                      const isModified = isRoleModified(role.id);
                      const assignedMembers = members.filter(
                        (m) => m.role_id === role.id || m.role.toLowerCase() === role.slug.toLowerCase(),
                      );
                      const isProtected = [1, 2, 3].includes(role.id) || role.scope === "PLATFORM";

                      return (
                        <th
                          key={role.id}
                          scope="col"
                          className="p-3 text-center border-l border-outline-variant/20 bg-surface-container-high/30"
                        >
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex items-center gap-1.5 justify-center max-w-full">
                              <span className="font-bold text-on-surface text-xs truncate uppercase tracking-wider">
                                {role.name}
                              </span>
                              {isModified && (
                                <span
                                  className="w-2 h-2 rounded-full bg-primary shrink-0"
                                  title="Unsaved changes in draft"
                                />
                              )}
                            </div>

                            <div className="flex items-center gap-1 justify-center flex-wrap">
                              <Badge variant="outline" size="sm" className="text-[10px] py-0 px-1 font-mono">
                                {effective.length} / {permissionsCatalog.length}
                              </Badge>

                              {assignedMembers.length > 0 && (
                                <Badge variant="secondary" size="sm" className="text-[10px] py-0 px-1">
                                  {assignedMembers.length} {assignedMembers.length === 1 ? "user" : "users"}
                                </Badge>
                              )}
                            </div>

                            {/* Quick Role Actions */}
                            <div className="flex items-center gap-1 mt-1">
                              <button
                                type="button"
                                onClick={() => handleToggleRoleAll(role.id)}
                                className="text-[10px] text-on-surface-variant hover:text-primary transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-surface-container-highest"
                                title="Grant all / Revoke all permissions for this role"
                              >
                                Toggle All
                              </button>

                              <button
                                type="button"
                                onClick={() => handleResetRoleDefaults(role.id)}
                                className="text-[10px] text-on-surface-variant hover:text-primary transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-surface-container-highest"
                                title="Reset this role to default preset"
                              >
                                Reset
                              </button>

                              {!isProtected && (
                                <button
                                  type="button"
                                  onClick={() => setRoleToDeactivate(role)}
                                  className="text-[10px] text-on-surface-variant/70 hover:text-error transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-error/10"
                                  title="Deactivate role (removes column from matrix without deleting permissions)"
                                >
                                  Deactivate
                                </button>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* Table Body Grouped by Module */}
                <tbody>
                  {Object.entries(permissionsByModule).map(([moduleKey, modulePerms]) => {
                    const meta = MODULE_META[moduleKey] || {
                      label: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1),
                      description: `Permissions controlling ${moduleKey} operations`,
                      icon: Icons.Shield,
                    };
                    const ModuleIcon = meta.icon;

                    return (
                      <React.Fragment key={moduleKey}>
                        {/* Module Section Header Row */}
                        <tr className="bg-surface-container-low/70 border-y border-outline-variant/30">
                          <td className="p-3.5 pl-4" colSpan={1}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-surface-container-highest text-primary flex items-center justify-center shrink-0">
                                <ModuleIcon size={15} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs sm:text-sm text-on-surface">
                                    {meta.label}
                                  </span>
                                  <Badge variant="outline" size="sm" className="text-[10px] py-0 px-1 font-mono">
                                    {modulePerms.length}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-on-surface-variant truncate">
                                  {meta.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role Module Toggle Controls */}
                          {activeRoles.map((role) => {
                            const effective = getRoleEffectivePermissions(role.id);
                            const modulePermNames = modulePerms.map((p) => p.name);
                            const grantedCount = modulePerms.filter((p) => effective.includes(p.name)).length;
                            const isAllGranted = grantedCount === modulePerms.length;

                            return (
                              <td
                                key={role.id}
                                className="p-2.5 text-center border-l border-outline-variant/20 bg-surface-container-low/50"
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleModuleForRole(role.id, modulePermNames)}
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                                      isAllGranted
                                        ? "bg-primary/15 text-primary border border-primary/30"
                                        : grantedCount > 0
                                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                                        : "bg-surface text-on-surface-variant border border-outline-variant/20 hover:border-outline-variant/60"
                                    }`}
                                    title={`Toggle all ${meta.label} for ${role.name}`}
                                  >
                                    {grantedCount} / {modulePerms.length}
                                  </button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>

                        {/* Individual Permission Rows */}
                        {modulePerms.map((perm) => (
                          <tr
                            key={perm.name}
                            className="border-b border-outline-variant/15 hover:bg-surface-container-lowest transition-colors"
                          >
                            <td className="p-3 pl-4 pr-3 align-middle">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <code className="text-xs font-mono font-semibold text-on-surface">
                                      {perm.name}
                                    </code>
                                    <Badge
                                      variant={getActionBadgeVariant(perm.action)}
                                      size="sm"
                                      className="text-[9px] uppercase tracking-wider py-0 px-1 font-semibold"
                                    >
                                      {perm.action}
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                                    {perm.description}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {/* Checkbox cell for each active role */}
                            {activeRoles.map((role) => {
                              const effective = getRoleEffectivePermissions(role.id);
                              const isChecked = effective.includes(perm.name);

                              return (
                                <td
                                  key={role.id}
                                  className="p-3 text-center border-l border-outline-variant/15 align-middle"
                                >
                                  <div className="flex items-center justify-center">
                                    <label
                                      htmlFor={`chk-${role.id}-${perm.name}`}
                                      className="p-1 rounded-md hover:bg-surface-container-high cursor-pointer transition-colors"
                                      title={`${isChecked ? "Revoke" : "Grant"} ${perm.name} for ${role.name}`}
                                    >
                                      <Checkbox
                                        id={`chk-${role.id}-${perm.name}`}
                                        checked={isChecked}
                                        onChange={() => handleTogglePermission(role.id, perm.name)}
                                        aria-label={`${perm.name} for ${role.name}`}
                                      />
                                    </label>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* =================================================================== */}
          {/* Mobile & Narrow Screen Adaptive Matrix Layout */}
          {/* (Intrinsic card architecture strictly prohibiting horizontal scrollbars) */}
          {/* =================================================================== */}
          <div className="md:hidden space-y-4">
            {Object.entries(permissionsByModule).map(([moduleKey, modulePerms]) => {
              const meta = MODULE_META[moduleKey] || {
                label: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1),
                description: `Permissions controlling ${moduleKey} operations`,
                icon: Icons.Shield,
              };
              const ModuleIcon = meta.icon;

              return (
                <Card key={moduleKey} className="border border-outline-variant/30 overflow-hidden">
                  <CardHeader className="p-4 bg-surface-container-low/60 border-b border-outline-variant/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center shrink-0">
                          <ModuleIcon size={16} />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-bold text-on-surface truncate">
                            {meta.label}
                          </CardTitle>
                          <CardDescription className="text-xs text-on-surface-variant truncate">
                            {modulePerms.length} actions available
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3.5 space-y-3.5 divide-y divide-outline-variant/15">
                    {modulePerms.map((perm) => (
                      <div key={perm.name} className="pt-3 first:pt-0 space-y-2">
                        {/* Permission Title & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <code className="text-xs font-mono font-bold text-on-surface">
                                {perm.name}
                              </code>
                              <Badge
                                variant={getActionBadgeVariant(perm.action)}
                                size="sm"
                                className="text-[9px] uppercase tracking-wider py-0 px-1 font-semibold"
                              >
                                {perm.action}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
                              {perm.description}
                            </p>
                          </div>
                        </div>

                        {/* Role Checkbox Pill Group (Responsive Wrap, No Overflow) */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {activeRoles.map((role) => {
                            const effective = getRoleEffectivePermissions(role.id);
                            const isChecked = effective.includes(perm.name);

                            return (
                              <label
                                key={role.id}
                                htmlFor={`mob-chk-${role.id}-${perm.name}`}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                                  isChecked
                                    ? "bg-primary/10 border-primary/40 text-on-surface"
                                    : "bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50"
                                }`}
                              >
                                <Checkbox
                                  id={`mob-chk-${role.id}-${perm.name}`}
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(role.id, perm.name)}
                                  aria-label={`${perm.name} for ${role.name}`}
                                />
                                <span className="font-semibold truncate text-[11px]">{role.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ADD ROLE MODAL (with Task 4 Duplicate & Inactive Role Reactivation) */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={handleCloseAddRoleModal}
        title="Add Store Role"
        description="Provision a new operational role. A new column will be dynamically added to your permission matrix."
        size="md"
        footer={
          inactiveConflictRole ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInactiveConflictRole(null)}
                disabled={createRoleMutation.isPending}
                className="cursor-pointer text-xs"
              >
                Choose Different Name
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleReactivateConflictRole}
                disabled={createRoleMutation.isPending}
                className="flex items-center gap-1.5 cursor-pointer text-xs"
              >
                {createRoleMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    <span>Reactivating...</span>
                  </>
                ) : (
                  <>
                    <Icons.RotateCcw size={13} />
                    <span>Reactivate Existing Role</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseAddRoleModal}
                disabled={createRoleMutation.isPending}
                className="cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-role-form"
                size="sm"
                variant="primary"
                disabled={createRoleMutation.isPending || !newRoleName.trim()}
                className="flex items-center gap-1.5 cursor-pointer text-xs"
              >
                {createRoleMutation.isPending ? (
                  <>
                    <Spinner size="sm" />
                    <span>Creating Role...</span>
                  </>
                ) : (
                  <>
                    <Icons.Plus size={14} />
                    <span>Create Role</span>
                  </>
                )}
              </Button>
            </div>
          )
        }
      >
        {inactiveConflictRole ? (
          /* Task 4 Inactive Role Reactivation Prompt */
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Icons.AlertCircle size={18} className="shrink-0" />
              <span>Deactivated Role Found in Database</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed text-xs">
              A deactivated role with the name <strong>{inactiveConflictRole.name}</strong> (slug:{" "}
              <code className="font-mono">{inactiveConflictRole.slug}</code>) already exists in the
              database with its previous permission assignments safely preserved.
            </p>
            <p className="text-on-surface-variant leading-relaxed text-xs">
              Would you like to <strong>reactivate this existing role</strong> to restore its saved
              permissions into the matrix, or choose a different name?
            </p>
          </div>
        ) : (
          <form id="create-role-form" onSubmit={handleSubmitCreateRole} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="new-role-name" className="text-xs font-semibold text-on-surface block">
                Role Name <span className="text-error">*</span>
              </label>
              <input
                id="new-role-name"
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Content Uploader, Catalog Moderator"
                disabled={createRoleMutation.isPending}
                maxLength={50}
                required
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-[11px] text-on-surface-variant">
                Normalized and checked against active and inactive database roles.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-role-desc" className="text-xs font-semibold text-on-surface block">
                Description (Optional)
              </label>
              <textarea
                id="new-role-desc"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Briefly describe what team members in this role are authorized to do..."
                disabled={createRoleMutation.isPending}
                rows={2}
                maxLength={255}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="clone-preset-select" className="text-xs font-semibold text-on-surface block">
                Starting Permissions Preset
              </label>
              <select
                id="clone-preset-select"
                value={cloneFromRoleId}
                onChange={(e) => setCloneFromRoleId(e.target.value)}
                disabled={createRoleMutation.isPending}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="none">Empty Preset (Start with 0 permissions)</option>
                {activeRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    Clone from {r.name} ({getRoleEffectivePermissions(r.id).length} permissions)
                  </option>
                ))}
              </select>
            </div>
          </form>
        )}
      </Modal>

      {/* ===================================================================== */}
      {/* INACTIVE ROLES MODAL (Task 3: View & Reactivate Inactive Roles) */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isInactiveModalOpen}
        onClose={() => setIsInactiveModalOpen(false)}
        title="Inactive Store Roles"
        description="Deactivated roles whose columns are hidden from the active matrix. Their permission records remain securely preserved in the database."
        size="md"
        footer={
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsInactiveModalOpen(false)}
            className="cursor-pointer text-xs"
          >
            Close
          </Button>
        }
      >
        <div className="space-y-3">
          {inactiveRoles.length === 0 ? (
            <div className="p-4 text-center text-xs text-on-surface-variant">
              No inactive roles found.
            </div>
          ) : (
            inactiveRoles.map((role) => {
              const savedPerms = getRoleEffectivePermissions(role.id);

              return (
                <div
                  key={role.id}
                  className="p-3 rounded-xl border border-outline-variant/30 bg-surface-container-low flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-on-surface truncate">
                        {role.name}
                      </span>
                      <Badge variant="secondary" size="sm" className="text-[10px] py-0 px-1 font-mono">
                        {role.slug}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {role.description || "Custom store role"}
                    </p>
                    <div className="text-[10px] text-primary font-medium">
                      {savedPerms.length} preserved permission{savedPerms.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => updateStatusMutation.mutate({ roleId: role.id, isActive: true })}
                    disabled={updateStatusMutation.isPending}
                    className="text-xs h-8 shrink-0 cursor-pointer gap-1"
                  >
                    <Icons.RotateCcw size={13} />
                    <span>Reactivate</span>
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* DEACTIVATE ROLE CONFIRMATION MODAL */}
      {/* ===================================================================== */}
      <Modal
        isOpen={Boolean(roleToDeactivate)}
        onClose={() => setRoleToDeactivate(null)}
        title={`Deactivate Role: ${roleToDeactivate?.name || ""}`}
        description="Deactivating this role will remove its column from the active matrix and prevent it from granting access to store members. All saved permissions remain securely preserved."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRoleToDeactivate(null)}
              disabled={updateStatusMutation.isPending}
              className="cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (roleToDeactivate) {
                  updateStatusMutation.mutate({ roleId: roleToDeactivate.id, isActive: false });
                }
              }}
              disabled={updateStatusMutation.isPending}
              className="cursor-pointer text-xs text-error border-error/40 hover:bg-error/10 flex items-center gap-1.5"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span>Deactivating...</span>
                </>
              ) : (
                <>
                  <Icons.EyeOff size={14} />
                  <span>Confirm Deactivation</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/20 text-xs text-on-surface-variant space-y-2">
          <p>
            When <strong>{roleToDeactivate?.name}</strong> is deactivated:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li>Its column will be hidden from the active permission matrix.</li>
            <li>No new store members can be assigned to this role.</li>
            <li>Existing members with this role will immediately have access locked.</li>
            <li>
              <strong>Saved permissions will NOT be deleted</strong> and will be fully restored when
              reactivated.
            </li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

export default PermissionsPage;
