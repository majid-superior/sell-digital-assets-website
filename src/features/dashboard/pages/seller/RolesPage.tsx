// src/features/dashboard/pages/seller/RolesPage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/Button.tsx";
import { Badge } from "@/components/ui/Badge.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card.tsx";
import { EmptyState } from "@/components/ui/EmptyState.tsx";
import { Modal } from "@/components/ui/Modal.tsx";
import { Skeleton } from "@/components/ui/Skeleton.tsx";
import { Spinner } from "@/components/ui/Spinner.tsx";
import { sellerUserService } from "@/services/v1/sellerUserService.ts";
import type { StoreTeamRole } from "@/types/user.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { getHumanErrorMessage } from "@/utils/errors.ts";

export const RolesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Queries
  const {
    data: roles = [],
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    error: rolesError,
  } = useQuery({
    queryKey: queryKeys.sellerUsers.roles(),
    queryFn: () => sellerUserService.getStoreRoles(),
  });

  const {
    data: members = [],
    isLoading: isLoadingMembers,
    isError: isErrorMembers,
    error: membersError,
  } = useQuery({
    queryKey: queryKeys.sellerUsers.list(),
    queryFn: () => sellerUserService.getTeamMembers(),
  });

  const {
    data: rolePermissions = [],
    isLoading: isLoadingRolePerms,
    isError: isErrorRolePerms,
    error: rolePermsError,
  } = useQuery({
    queryKey: queryKeys.sellerUsers.rolePermissions(),
    queryFn: () => sellerUserService.getRolePermissions(),
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

  const isLoading = isLoadingRoles || isLoadingMembers || isLoadingRolePerms || isLoadingCatalog;

  useEffect(() => {
    if (isErrorRoles) {
      toast.error("Failed to load store roles", {
        description: getHumanErrorMessage(rolesError, "Unable to load store roles. Please try again."),
      });
    }
  }, [isErrorRoles, rolesError]);

  useEffect(() => {
    if (isErrorMembers) {
      toast.error("Failed to load store team members", {
        description: getHumanErrorMessage(membersError, "Unable to load team members."),
      });
    }
  }, [isErrorMembers, membersError]);

  useEffect(() => {
    if (isErrorRolePerms) {
      toast.error("Failed to load role permissions", {
        description: getHumanErrorMessage(rolePermsError, "Unable to load configured role permissions."),
      });
    }
  }, [isErrorRolePerms, rolePermsError]);

  useEffect(() => {
    if (isErrorCatalog) {
      toast.error("Failed to load permissions catalog", {
        description: getHumanErrorMessage(catalogError, "Unable to load permissions catalog."),
      });
    }
  }, [isErrorCatalog, catalogError]);

  // Assign Role Modal state
  const [assigningRole, setAssigningRole] = useState<StoreTeamRole | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: number }) =>
      sellerUserService.updateTeamMember(memberId, { roleId }),
    onSuccess: (updated) => {
      toast.success("Role assigned successfully", {
        description: `${updated.name} has been assigned the role of ${assigningRole?.name || updated.role}.`,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellerUsers.all });
      handleCloseAssignModal();
    },
    onError: (err: unknown) => {
      toast.error("Role assignment failed", {
        description: getHumanErrorMessage(err, "Unable to update member role."),
      });
    },
  });

  const handleOpenAssignModal = (role: StoreTeamRole) => {
    setAssigningRole(role);
    setSelectedMemberId(members.length > 0 ? members[0].id : "");
  };

  const handleCloseAssignModal = () => {
    setAssigningRole(null);
    setSelectedMemberId("");
  };

  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningRole || !selectedMemberId) {
      toast.error("Selection required", {
        description: "Please select a store member to assign this role to.",
      });
      return;
    }

    assignRoleMutation.mutate({
      memberId: selectedMemberId,
      roleId: assigningRole.id,
    });
  };

  // KPI Stats
  const kpiStats = useMemo(() => {
    const totalRoles = roles.length;
    const totalMembers = members.length;
    const customizedRoles = rolePermissions.filter((rp) => rp.isCustomized).length;
    const defaultRoles = totalRoles - customizedRoles;

    return { totalRoles, totalMembers, customizedRoles, defaultRoles };
  }, [roles, members, rolePermissions]);

  const renderRoleBadge = (roleSlug: string) => {
    const normalized = roleSlug.toLowerCase();
    if (normalized.includes("manager")) {
      return (
        <Badge variant="warning" size="sm" className="font-medium tracking-wide">
          Manager Tier
        </Badge>
      );
    }
    if (normalized.includes("user") || normalized.includes("uploader")) {
      return (
        <Badge variant="success" size="sm" className="font-medium tracking-wide">
          User Tier
        </Badge>
      );
    }
    if (normalized.includes("analyst")) {
      return (
        <Badge variant="primary" size="sm" className="font-medium tracking-wide">
          Analytics Tier
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm">
        Store Role
      </Badge>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Store Roles
            </h1>
            <Badge variant="outline" size="sm" className="text-xs">
              {roles.length} {roles.length === 1 ? "Role" : "Roles"} Available
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl">
            Roles available for assignment to store team members. Each role defines a baseline set
            of operational capabilities governing what collaborators can view and perform.
          </p>
        </div>

        {/* Action button to create role / manage permissions matrix */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/dashboard/seller/users/permissions")}
            className="shrink-0 flex items-center justify-center gap-2 w-full sm:w-auto text-xs cursor-pointer"
          >
            <Icons.Plus size={15} />
            <span>Create Role</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
              Available Roles
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icons.Shield size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-surface mt-2">
            {isLoading ? <Skeleton className="h-7 w-12" /> : kpiStats.totalRoles}
          </div>
          <p className="text-[11px] sm:text-xs text-on-surface-variant/80 mt-0.5">
            Assignable role definitions
          </p>
        </Card>

        <Card className="p-4 sm:p-5 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
              Assigned Members
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Icons.Users size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-surface mt-2">
            {isLoading ? <Skeleton className="h-7 w-12" /> : kpiStats.totalMembers}
          </div>
          <p className="text-[11px] sm:text-xs text-on-surface-variant/80 mt-0.5">
            Store collaborators with roles
          </p>
        </Card>

        <Card className="p-4 sm:p-5 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
              Customized Roles
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Icons.Edit size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-surface mt-2">
            {isLoading ? <Skeleton className="h-7 w-12" /> : kpiStats.customizedRoles}
          </div>
          <p className="text-[11px] sm:text-xs text-on-surface-variant/80 mt-0.5">
            Modified store permission sets
          </p>
        </Card>

        <Card className="p-4 sm:p-5 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
              System Defaults
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Icons.Package size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-surface mt-2">
            {isLoading ? <Skeleton className="h-7 w-12" /> : kpiStats.defaultRoles}
          </div>
          <p className="text-[11px] sm:text-xs text-on-surface-variant/80 mt-0.5">
            Standard baseline presets
          </p>
        </Card>
      </div>

      {/* Roles Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-on-surface">
            Assignable Role Directory
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/seller/users/permissions")}
            className="text-xs cursor-pointer gap-1.5"
          >
            <Icons.KeyRound size={14} />
            <span>Manage All Permissions</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-12 w-full" />
                <div className="pt-2 border-t border-outline-variant/20 flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </Card>
            ))}
          </div>
        ) : roles.length === 0 ? (
          <EmptyState
            icon={<Icons.Shield size={28} className="text-primary" />}
            title="No Store Roles Available"
            description={
              isErrorRoles
                ? "There was an error communicating with the server while retrieving store roles."
                : "No assignable store roles were found. Please verify your store configuration or refresh the page."
            }
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => void queryClient.invalidateQueries({ queryKey: queryKeys.sellerUsers.all })}
                className="gap-2 cursor-pointer"
              >
                <Icons.RotateCcw size={14} />
                <span>Retry</span>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const rConfig = rolePermissions.find((rp) => rp.roleId === role.id);
              const assignedMembers = members.filter(
                (m) => m.role_id === role.id || m.role.toLowerCase() === role.slug.toLowerCase(),
              );
              const grantedCount = rConfig?.permissions.length || 0;
              const totalPerms = permissionsCatalog.length || 16;
              const isCustomized = rConfig?.isCustomized;

              return (
                <Card
                  key={role.id}
                  className="border border-outline-variant/30 hover:border-outline-variant/60 transition-all duration-150 flex flex-col justify-between shadow-xs hover:shadow-sm"
                >
                  <CardHeader className="p-4 sm:p-5 pb-3">
                    {/* Top Row: Title & Preset Badge */}
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <CardTitle className="text-base sm:text-lg font-bold tracking-tight text-on-surface truncate">
                        {role.name}
                      </CardTitle>

                      {isCustomized ? (
                        <Badge variant="warning" size="sm" className="text-[10px] font-medium shrink-0 whitespace-nowrap">
                          Customized
                        </Badge>
                      ) : (
                        <Badge variant="outline" size="sm" className="text-[10px] font-medium shrink-0 whitespace-nowrap">
                          Default Preset
                        </Badge>
                      )}
                    </div>

                    {/* Sub Row: Tier Tag and Slug */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {renderRoleBadge(role.slug)}
                      <code className="text-[11px] text-on-surface-variant/70 font-mono bg-surface-container-low px-1.5 py-0.5 rounded border border-outline-variant/20">
                        {role.slug}
                      </code>
                    </div>

                    <CardDescription className="text-xs text-on-surface-variant line-clamp-3 mt-2.5 leading-relaxed min-h-[38px]">
                      {role.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                    {/* Role Metrics Box with visual progress bar */}
                    <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs space-y-2.5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant shrink-0">
                            <Icons.Users size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-on-surface-variant/80 text-[10px] uppercase font-semibold tracking-wider block">
                              Assigned
                            </span>
                            <span className="font-bold text-on-surface truncate block">
                              {assignedMembers.length}{" "}
                              {assignedMembers.length === 1 ? "Member" : "Members"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Icons.Shield size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-on-surface-variant/80 text-[10px] uppercase font-semibold tracking-wider block">
                              Capabilities
                            </span>
                            <span className="font-bold text-primary truncate block">
                              {grantedCount} / {totalPerms}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Capability Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-on-surface-variant/70">
                          <span>Coverage</span>
                          <span className="font-mono font-medium">
                            {Math.round((grantedCount / (totalPerms || 16)) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-highest/60 rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-primary h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.round((grantedCount / (totalPerms || 16)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Assigned Members Preview */}
                    <div className="min-h-[36px] flex flex-col justify-center">
                      {assignedMembers.length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-[11px] font-medium text-on-surface-variant block">
                            Assigned to:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {assignedMembers.slice(0, 3).map((m) => (
                              <span
                                key={m.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-outline-variant/20 text-[11px] text-on-surface truncate max-w-[140px]"
                                title={`${m.name} (${m.email})`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="truncate">{m.name}</span>
                              </span>
                            ))}
                            {assignedMembers.length > 3 && (
                              <span className="text-[11px] text-on-surface-variant self-center">
                                +{assignedMembers.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/60 italic">
                          <Icons.Info size={13} className="shrink-0 opacity-60" />
                          <span>No team members currently assigned to this role.</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-outline-variant/15">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAssignModal(role)}
                        className="flex-1 text-xs h-8.5 cursor-pointer gap-1.5 font-medium hover:border-outline-variant/60"
                      >
                        <Icons.User size={13} />
                        <span>Assign Member</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          void navigate(`/dashboard/seller/users/permissions?role=${role.id}`);
                        }}
                        className="flex-1 text-xs h-8.5 cursor-pointer gap-1.5 font-medium shadow-xs"
                      >
                        <Icons.KeyRound size={13} />
                        <span>Permissions</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ASSIGN ROLE TO MEMBER MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(assigningRole)}
        onClose={handleCloseAssignModal}
        title={`Assign ${assigningRole?.name || "Role"}`}
        description={`Select a store collaborator to assign to the ${assigningRole?.name} role.`}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseAssignModal}
              disabled={assignRoleMutation.isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="assign-role-form"
              disabled={assignRoleMutation.isPending || members.length === 0}
              className="flex items-center gap-2 cursor-pointer"
            >
              {assignRoleMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span>Assigning...</span>
                </>
              ) : (
                <span>Confirm Assignment</span>
              )}
            </Button>
          </>
        }
      >
        <form id="assign-role-form" onSubmit={handleConfirmAssignment} className="space-y-4">
          {members.length === 0 ? (
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface-variant text-center space-y-2">
              <p>You have not added any collaborators to your store team yet.</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  handleCloseAssignModal();
                  void navigate("/dashboard/seller/users/members");
                }}
                className="cursor-pointer text-xs"
              >
                Go to Members Page to Add Team Member
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <label
                htmlFor="assign-member-select"
                className="text-xs font-medium text-on-surface block"
              >
                Select Store Member
              </label>
              <select
                id="assign-member-select"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                disabled={assignRoleMutation.isPending}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email}) — Currently: {m.role_name || m.role}
                  </option>
                ))}
              </select>

              {assigningRole && (
                <div className="p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/20 text-xs text-on-surface-variant space-y-1 mt-2">
                  <div className="flex items-center gap-2">
                    <Icons.Shield size={15} className="text-primary" />
                    <span className="font-semibold text-on-surface">Target Role:</span>
                    <span>{assigningRole.name}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    {assigningRole.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};

export default RolesPage;

