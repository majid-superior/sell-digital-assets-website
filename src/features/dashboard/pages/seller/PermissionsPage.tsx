// src/features/dashboard/pages/seller/PermissionsPage.tsx
import React, { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/Button.tsx";
import { Badge } from "@/components/ui/Badge.tsx";
import { Checkbox } from "@/components/ui/Checkbox.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card.tsx";
import { Skeleton } from "@/components/ui/Skeleton.tsx";
import { Spinner } from "@/components/ui/Spinner.tsx";
import { sellerUserService } from "@/services/v1/sellerUserService.ts";
import type { PermissionItem } from "@/types/user.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { getHumanErrorMessage } from "@/utils/errors.ts";

const DEFAULT_ROLE_PERMS: Record<number, string[]> = {
  4: [
    "analytics:view",
    "products:view",
    "products:create",
    "products:edit",
    "coupons:view",
    "coupons:manage",
    "orders:view",
    "financial:view",
    "storefront:view",
    "storefront:edit",
    "team:view",
    "settings:view",
  ],
  5: ["products:view", "products:create", "products:edit", "storefront:view"],
  6: ["analytics:view", "products:view", "orders:view"],
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
  coupons: {
    label: "Coupons & Discounts",
    description: "Promotional campaigns, discount codes, and special offers",
    icon: Icons.Tag,
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

export const PermissionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: queryKeys.sellerUsers.roles(),
    queryFn: () => sellerUserService.getStoreRoles(),
  });

  const { data: permissionsCatalog = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: queryKeys.sellerUsers.permissionsCatalog(),
    queryFn: () => sellerUserService.getPermissionsCatalog(),
  });

  const { data: rolePermissions = [], isLoading: isLoadingRolePerms } = useQuery({
    queryKey: queryKeys.sellerUsers.rolePermissions(),
    queryFn: () => sellerUserService.getRolePermissions(),
  });

  const isLoading = isLoadingRoles || isLoadingCatalog || isLoadingRolePerms;

  // Selected role state with query param support
  const queryRoleId = searchParams.get("role");
  const [userSelectedRoleId, setUserSelectedRoleId] = useState<number | null>(null);

  const effectiveConfigRoleId =
    userSelectedRoleId ??
    (queryRoleId ? Number(queryRoleId) : null) ??
    (roles.length > 0 ? roles[0].id : 6);
  const activeRoleConfig = rolePermissions.find((rp) => rp.roleId === effectiveConfigRoleId);
  const activeRoleInfo = roles.find((r) => r.id === effectiveConfigRoleId);

  // Draft permissions per role
  const [draftPermissions, setDraftPermissions] = useState<Record<number, string[]>>({});

  const activePermissions = useMemo(() => {
    if (!effectiveConfigRoleId) return [];
    if (draftPermissions[effectiveConfigRoleId] !== undefined) {
      return draftPermissions[effectiveConfigRoleId];
    }
    return activeRoleConfig?.permissions ?? DEFAULT_ROLE_PERMS[effectiveConfigRoleId] ?? [];
  }, [effectiveConfigRoleId, draftPermissions, activeRoleConfig]);

  const isRoleDirty = useMemo(() => {
    if (!effectiveConfigRoleId) return false;
    if (draftPermissions[effectiveConfigRoleId] === undefined) return false;
    const current = activeRoleConfig?.permissions ?? DEFAULT_ROLE_PERMS[effectiveConfigRoleId] ?? [];
    const drafted = draftPermissions[effectiveConfigRoleId];
    if (current.length !== drafted.length) return true;
    const setA = new Set(current);
    return drafted.some((p) => !setA.has(p));
  }, [effectiveConfigRoleId, draftPermissions, activeRoleConfig]);

  // Group permissions catalog by module
  const permissionsByModule = useMemo(() => {
    const groups: Record<string, PermissionItem[]> = {};
    for (const item of permissionsCatalog) {
      if (!groups[item.module]) {
        groups[item.module] = [];
      }
      groups[item.module].push(item);
    }
    return groups;
  }, [permissionsCatalog]);

  // Save role permissions mutation
  const saveRolePermsMutation = useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: number; permissions: string[] }) =>
      sellerUserService.updateRolePermissions(roleId, permissions),
    onSuccess: (updated) => {
      toast.success("Role permissions updated", {
        description: `Permissions for ${updated.roleName} have been updated. Changes take effect immediately across your store.`,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellerUsers.all });
      setDraftPermissions((prev) => {
        const next = { ...prev };
        delete next[updated.roleId];
        return next;
      });
    },
    onError: (err: unknown) => {
      toast.error("Failed to update role permissions", {
        description: getHumanErrorMessage(err, "Unable to save permissions."),
      });
    },
  });

  const handleSelectRole = (roleId: number) => {
    setUserSelectedRoleId(roleId);
    setSearchParams({ role: String(roleId) });
  };

  const handleTogglePermission = (permName: string) => {
    if (!effectiveConfigRoleId) return;
    setDraftPermissions((prev) => {
      const existing =
        prev[effectiveConfigRoleId] ??
        activeRoleConfig?.permissions ??
        DEFAULT_ROLE_PERMS[effectiveConfigRoleId] ??
        [];
      const hasPerm = existing.includes(permName);
      const updated = hasPerm ? existing.filter((p) => p !== permName) : [...existing, permName];
      return { ...prev, [effectiveConfigRoleId]: updated };
    });
  };

  const handleToggleModuleAll = (modulePerms: PermissionItem[]) => {
    if (!effectiveConfigRoleId) return;
    const permNames = modulePerms.map((p) => p.name);
    const allChecked = permNames.every((p) => activePermissions.includes(p));

    setDraftPermissions((prev) => {
      const existing =
        prev[effectiveConfigRoleId] ??
        activeRoleConfig?.permissions ??
        DEFAULT_ROLE_PERMS[effectiveConfigRoleId] ??
        [];
      let updated: string[];
      if (allChecked) {
        updated = existing.filter((p) => !permNames.includes(p));
      } else {
        updated = Array.from(new Set([...existing, ...permNames]));
      }
      return { ...prev, [effectiveConfigRoleId]: updated };
    });
  };

  const handleResetRoleToDefaults = () => {
    if (!effectiveConfigRoleId) return;
    const defaults = DEFAULT_ROLE_PERMS[effectiveConfigRoleId] ?? [];
    setDraftPermissions((prev) => ({
      ...prev,
      [effectiveConfigRoleId]: defaults,
    }));
    toast.info("Default role preset applied to draft", {
      description: "Click 'Save Permissions' to persist the default configuration.",
    });
  };

  const handleDiscardChanges = () => {
    if (!effectiveConfigRoleId) return;
    setDraftPermissions((prev) => {
      const next = { ...prev };
      delete next[effectiveConfigRoleId];
      return next;
    });
    toast.info("Changes discarded", {
      description: "Draft reverted to active store permissions.",
    });
  };

  const handleSaveRolePermissions = () => {
    if (!effectiveConfigRoleId) return;
    saveRolePermsMutation.mutate({
      roleId: effectiveConfigRoleId,
      permissions: activePermissions,
    });
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
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

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Role Permissions
            </h1>
            <Badge variant="outline" size="sm" className="text-xs">
              {roles.length} Roles Configured
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl">
            Configure granular database-backed capabilities for each store role to control dashboard
            access, catalog mutations, and financial visibility for your collaborators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/seller/users/roles")}
            className="text-xs cursor-pointer gap-1.5"
          >
            <Icons.Shield size={14} />
            <span>View All Roles</span>
          </Button>
        </div>
      </div>

      {/* Role Selector Toolbar & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low p-3 sm:p-4 rounded-xl border border-outline-variant/30">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
            Role:
          </span>
          {roles.map((r) => {
            const isSelected = r.id === effectiveConfigRoleId;
            const rConfig = rolePermissions.find((rp) => rp.roleId === r.id);
            const isCustomized = rConfig?.isCustomized;

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRole(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                  isSelected
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface text-on-surface border border-outline-variant/30 hover:border-primary/50"
                }`}
              >
                <span>{r.name}</span>
                {isCustomized ? (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      isSelected
                        ? "bg-on-primary/20 text-on-primary"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    }`}
                  >
                    Customized
                  </span>
                ) : (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      isSelected
                        ? "bg-on-primary/20 text-on-primary"
                        : "bg-surface-variant/40 text-on-surface-variant"
                    }`}
                  >
                    Default
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/15">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetRoleToDefaults}
            disabled={saveRolePermsMutation.isPending}
            className="text-xs h-8 cursor-pointer"
            title="Restore system defaults for this role"
          >
            <Icons.RotateCcw size={13} className="mr-1.5" />
            <span>Reset to Default Preset</span>
          </Button>

          {isRoleDirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDiscardChanges}
              disabled={saveRolePermsMutation.isPending}
              className="text-xs h-8 cursor-pointer"
            >
              Discard
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleSaveRolePermissions}
            disabled={saveRolePermsMutation.isPending || !isRoleDirty}
            className="text-xs h-8 flex items-center gap-1.5 cursor-pointer"
          >
            {saveRolePermsMutation.isPending ? (
              <>
                <Spinner size="sm" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Icons.Check size={14} />
                <span>Save Permissions</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Active Role Meta Banner */}
      {activeRoleInfo && (
        <Card className="p-4 sm:p-5 border border-outline-variant/30 bg-surface-container-lowest transition-colors duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Icons.Shield size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-on-surface">
                    {activeRoleInfo.name} Permissions
                  </h2>
                  {activeRoleConfig?.isCustomized ? (
                    <Badge variant="warning" size="sm">
                      Customized for Your Store
                    </Badge>
                  ) : (
                    <Badge variant="outline" size="sm">
                      Default Preset
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
                  {activeRoleInfo.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/dashboard/seller/users/members?role=${effectiveConfigRoleId}`)
                }
                className="text-xs h-8 cursor-pointer gap-1.5"
              >
                <Icons.Users size={13} />
                <span>View Role Members</span>
              </Button>

              <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs">
                <span className="text-on-surface-variant font-medium">Granted Capabilities:</span>
                <span className="font-bold text-primary">
                  {activePermissions.length} / {permissionsCatalog.length}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Modules Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 sm:p-5 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <div className="space-y-2 pt-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-56" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(permissionsByModule).map(([moduleKey, modulePerms]) => {
            const meta = MODULE_META[moduleKey] || {
              label: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1),
              description: `Permissions controlling ${moduleKey} operations`,
              icon: Icons.Shield,
            };
            const ModuleIcon = meta.icon;

            const enabledCount = modulePerms.filter((p) =>
              activePermissions.includes(p.name),
            ).length;
            const isAllSelected = enabledCount === modulePerms.length;

            return (
              <Card
                key={moduleKey}
                className="border border-outline-variant/30 transition-colors duration-150 flex flex-col justify-between"
              >
                <CardHeader className="p-4 sm:p-5 pb-3 border-b border-outline-variant/15">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                        <ModuleIcon size={16} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm sm:text-base font-semibold truncate">
                          {meta.label}
                        </CardTitle>
                        <CardDescription className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                          {meta.description}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={enabledCount > 0 ? "primary" : "outline"}
                        size="sm"
                        className="text-[11px]"
                      >
                        {enabledCount}/{modulePerms.length}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleModuleAll(modulePerms)}
                        className="h-7 px-2 text-[11px] cursor-pointer"
                      >
                        {isAllSelected ? "Deselect" : "Select All"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 pt-3 space-y-3">
                  {modulePerms.map((perm) => {
                    const isChecked = activePermissions.includes(perm.name);

                    return (
                      <div
                        key={perm.id}
                        className={`p-3 rounded-lg border transition-all ${
                          isChecked
                            ? "border-primary/30 bg-primary/5"
                            : "border-outline-variant/20 bg-surface hover:border-outline-variant/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <Checkbox
                            id={`perm-${perm.id}`}
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.name)}
                            label={
                              <span className="font-semibold text-xs sm:text-sm text-on-surface">
                                {perm.name}
                              </span>
                            }
                            description={
                              <span className="text-xs text-on-surface-variant leading-relaxed block mt-0.5">
                                {perm.description}
                              </span>
                            }
                          />
                          <Badge
                            variant={getActionBadgeVariant(perm.action)}
                            size="sm"
                            className="uppercase text-[10px] tracking-wide shrink-0 font-medium"
                          >
                            {perm.action}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PermissionsPage;

