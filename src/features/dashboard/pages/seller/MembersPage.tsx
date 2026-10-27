// src/features/dashboard/pages/seller/MembersPage.tsx
import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/Button.tsx";
import { Input } from "@/components/ui/Input.tsx";
import { Label } from "@/components/ui/Label.tsx";
import { Badge } from "@/components/ui/Badge.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card.tsx";
import { EmptyState } from "@/components/ui/EmptyState.tsx";
import { Modal } from "@/components/ui/Modal.tsx";
import { Skeleton } from "@/components/ui/Skeleton.tsx";
import { Spinner } from "@/components/ui/Spinner.tsx";
import {
  sellerUserService,
  type CreateTeamMemberPayload,
  type UpdateTeamMemberPayload,
} from "@/services/v1/sellerUserService.ts";
import type { StoreTeamMember } from "@/types/user.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { getHumanErrorMessage } from "@/utils/errors.ts";

const addMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(4, "Password must be at least 4 characters").max(128),
  roleId: z.number({ message: "Please select an authorized store role" }).int().positive(),
});

const editMemberSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
  roleId: z.number().int().positive().optional(),
  status: z.enum(["active", "suspended", "deactive", "pending"]).optional(),
  password: z.string().min(4, "Password must be at least 4 characters").max(128).optional().or(z.literal("")),
});

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

export const MembersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Queries
  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: queryKeys.sellerUsers.list(),
    queryFn: () => sellerUserService.getTeamMembers(),
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: queryKeys.sellerUsers.roles(),
    queryFn: () => sellerUserService.getStoreRoles(),
  });

  const { data: rolePermissions = [] } = useQuery({
    queryKey: queryKeys.sellerUsers.rolePermissions(),
    queryFn: () => sellerUserService.getRolePermissions(),
  });

  const isLoading = isLoadingMembers || isLoadingRoles;

  // Filters & search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const queryRoleParam = searchParams.get("role");
  const [userRoleFilter, setUserRoleFilter] = useState<string | null>(null);
  const roleFilter = userRoleFilter ?? (queryRoleParam || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<StoreTeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<StoreTeamMember | null>(null);

  // Add form fields
  const [addName, setAddName] = useState<string>("");
  const [addEmail, setAddEmail] = useState<string>("");
  const [addPassword, setAddPassword] = useState<string>("");
  const [addRoleId, setAddRoleId] = useState<number | null>(null);
  const [showAddPassword, setShowAddPassword] = useState<boolean>(false);

  // Edit form fields
  const [editName, setEditName] = useState<string>("");
  const [editRoleId, setEditRoleId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<"active" | "suspended">("active");
  const [editPassword, setEditPassword] = useState<string>("");
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);

  // Mutations
  const addMutation = useMutation({
    mutationFn: (payload: CreateTeamMemberPayload) => sellerUserService.createTeamMember(payload),
    onSuccess: (newMember) => {
      toast.success("Team member added", {
        description: `${newMember.name} has been successfully added to your store team.`,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellerUsers.all });
      handleCloseAddModal();
    },
    onError: (err: unknown) => {
      toast.error("Unable to add team member", {
        description: getHumanErrorMessage(err, "Failed to create team member. Please try again."),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTeamMemberPayload }) =>
      sellerUserService.updateTeamMember(id, payload),
    onSuccess: (updated) => {
      toast.success("Team member updated", {
        description: `${updated.name}'s permissions and profile have been saved.`,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellerUsers.all });
      handleCloseEditModal();
    },
    onError: (err: unknown) => {
      toast.error("Unable to update team member", {
        description: getHumanErrorMessage(err, "Failed to update team member."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sellerUserService.deleteTeamMember(id),
    onSuccess: () => {
      if (deletingMember) {
        toast.success("Team member removed", {
          description: `${deletingMember.name} has been removed from your store team.`,
        });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.sellerUsers.all });
      setDeletingMember(null);
    },
    onError: (err: unknown) => {
      toast.error("Removal failed", {
        description: getHumanErrorMessage(err, "Unable to remove team member."),
      });
    },
  });

  // Effective selected role ID for Add modal
  const effectiveAddRoleId = addRoleId ?? (roles.length > 0 ? roles[0].id : null);
  const selectedAddRole = roles.find((r) => r.id === effectiveAddRoleId);
  const selectedEditRole = roles.find((r) => r.id === editRoleId);

  const currentAddRolePerms = useMemo(() => {
    if (!effectiveAddRoleId) return [];
    const configured = rolePermissions.find((rp) => rp.roleId === effectiveAddRoleId);
    return configured?.permissions ?? DEFAULT_ROLE_PERMS[effectiveAddRoleId] ?? [];
  }, [effectiveAddRoleId, rolePermissions]);

  const currentEditRolePerms = useMemo(() => {
    if (!editRoleId) return [];
    const configured = rolePermissions.find((rp) => rp.roleId === editRoleId);
    return configured?.permissions ?? DEFAULT_ROLE_PERMS[editRoleId] ?? [];
  }, [editRoleId, rolePermissions]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        (member.role_name && member.role_name.toLowerCase().includes(query)) ||
        member.role.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" ||
        String(member.role_id) === roleFilter ||
        member.role.toLowerCase() === roleFilter.toLowerCase();

      const normalizedStatus =
        member.status === "deactive" ? "suspended" : member.status;
      const matchesStatus =
        statusFilter === "all" || normalizedStatus.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  // Key performance indicators
  const kpiStats = useMemo(() => {
    const total = members.length;
    const active = members.filter((m) => m.status === "active").length;
    const managers = members.filter(
      (m) => m.role.toLowerCase().includes("manager") || m.role_id === 4,
    ).length;
    const contributors = members.filter(
      (m) =>
        m.role.toLowerCase().includes("uploader") ||
        m.role.toLowerCase().includes("analyst") ||
        m.role_id === 5 ||
        m.role_id === 6,
    ).length;

    return { total, active, managers, contributors };
  }, [members]);

  // Open Edit Modal
  const handleOpenEdit = (member: StoreTeamMember) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditRoleId(member.role_id);
    setEditStatus(
      member.status === "suspended" || member.status === "deactive"
        ? "suspended"
        : "active",
    );
    setEditPassword("");
    setShowEditPassword(false);
  };

  // Close Add Modal
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setAddName("");
    setAddEmail("");
    setAddPassword("");
    setShowAddPassword(false);
    setAddRoleId(null);
  };

  // Close Edit Modal
  const handleCloseEditModal = () => {
    setEditingMember(null);
    setEditName("");
    setEditPassword("");
    setShowEditPassword(false);
  };

  // Handle Add Member Submission
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: addName.trim(),
      email: addEmail.trim(),
      password: addPassword,
      roleId: effectiveAddRoleId ?? undefined,
    };

    const validation = addMemberSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      toast.error("Validation Error", {
        description: firstIssue?.message || "Please check the entered team member details.",
      });
      return;
    }

    addMutation.mutate(validation.data);
  };

  // Handle Edit Member Submission
  const handleEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    const payload: UpdateTeamMemberPayload = {
      name: editName.trim() !== editingMember.name ? editName.trim() : undefined,
      roleId: editRoleId !== null && editRoleId !== editingMember.role_id ? editRoleId : undefined,
      status: editStatus !== editingMember.status ? editStatus : undefined,
      password: editPassword.trim() ? editPassword : undefined,
    };

    const validation = editMemberSchema.safeParse(payload);
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];
      toast.error("Validation Error", {
        description: firstIssue?.message || "Please check the update details.",
      });
      return;
    }

    updateMutation.mutate({ id: editingMember.id, payload: validation.data });
  };

  // Handle Quick Status Toggle
  const handleToggleStatus = (member: StoreTeamMember) => {
    const isCurrentlyActive = member.status === "active";
    const nextStatus = isCurrentlyActive ? "suspended" : "active";

    updateMutation.mutate({
      id: member.id,
      payload: { status: nextStatus },
    });
  };

  // Handle Delete Member Confirmation
  const handleDeleteMember = () => {
    if (!deletingMember) return;
    deleteMutation.mutate(deletingMember.id);
  };

  // Role Badge Formatter
  const renderRoleBadge = (roleName: string, roleSlug?: string) => {
    const normalized = (roleSlug || roleName).toLowerCase();
    if (normalized.includes("manager")) {
      return (
        <Badge variant="warning" size="sm" className="font-medium tracking-wide">
          Store Manager
        </Badge>
      );
    }
    if (normalized.includes("uploader")) {
      return (
        <Badge variant="success" size="sm" className="font-medium tracking-wide">
          Content Uploader
        </Badge>
      );
    }
    if (normalized.includes("analyst")) {
      return (
        <Badge variant="primary" size="sm" className="font-medium tracking-wide">
          Analyst
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm">
        {roleName}
      </Badge>
    );
  };

  // Status Badge Formatter
  const renderStatusBadge = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized === "active") {
      return (
        <Badge variant="success" size="sm" className="gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </Badge>
      );
    }
    if (normalized === "suspended" || normalized === "deactive") {
      return (
        <Badge variant="error" size="sm" className="gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Suspended
        </Badge>
      );
    }
    return (
      <Badge variant="warning" size="sm">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
              Store Members
            </h1>
            <Badge variant="outline" size="sm" className="text-xs">
              {members.length} {members.length === 1 ? "Member" : "Members"}
            </Badge>
          </div>
          <p className="text-sm text-on-surface-variant mt-1.5 max-w-2xl">
            Manage your store collaborators and assign roles dynamically configured in the backend
            database.
          </p>
        </div>

        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="shrink-0 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <Icons.Plus size={18} />
          <span>Add Member</span>
        </Button>
      </div>

      {/* KPI Metrics Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
              Total Members
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icons.Users size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-surface mt-2">
            {isLoading ? <Skeleton className="h-7 w-12" /> : kpiStats.total}
          </div>
          <p className="text-[11px] sm:text-xs text-on-surface-variant/80 mt-0.5">
            Store collaborators
          </p>
        </Card>

        <Card className="p-4 sm:p-5 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
              Active Access
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Icons.Success size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-surface mt-2">
            {isLoading ? <Skeleton className="h-7 w-12" /> : kpiStats.active}
          </div>
          <p className="text-[11px] sm:text-xs text-on-surface-variant/80 mt-0.5">
            Active credentials
          </p>
        </Card>

        <Card className="p-4 sm:p-5 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
              Managers
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Icons.Shield size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-surface mt-2">
            {isLoading ? <Skeleton className="h-7 w-12" /> : kpiStats.managers}
          </div>
          <p className="text-[11px] sm:text-xs text-on-surface-variant/80 mt-0.5">
            Operational managers
          </p>
        </Card>

        <Card className="p-4 sm:p-5 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-medium text-on-surface-variant">
              Uploaders & Analysts
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Icons.Package size={16} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-on-surface mt-2">
            {isLoading ? <Skeleton className="h-7 w-12" /> : kpiStats.contributors}
          </div>
          <p className="text-[11px] sm:text-xs text-on-surface-variant/80 mt-0.5">
            Scoped specialists
          </p>
        </Card>
      </div>

      {/* Main Members Card */}
      <Card className="border border-outline-variant/30 transition-colors duration-150">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-outline-variant/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg">Members Directory</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                Authorized store users and team collaborators linked to your primary seller account.
              </CardDescription>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              {/* Search box with canonical min-w-50 */}
              <div className="relative min-w-50 sm:w-60">
                <Icons.Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface cursor-pointer"
                    aria-label="Clear search"
                  >
                    <Icons.Close size={14} />
                  </button>
                )}
              </div>

              {/* Role filter */}
              <select
                value={roleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                aria-label="Filter by role"
                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="all">All Roles</option>
                {roles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            /* Loading geometric skeletons to eliminate layout shift */
            <div className="p-4 sm:p-6 space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-outline-variant/20 bg-surface-container-lowest"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            /* Empty Directory State */
            <div className="p-6 sm:p-10">
              <EmptyState
                icon={<Icons.Users size={28} className="text-primary" />}
                title="No Members Added"
                description="Invite collaborators with defined operational roles to assist in managing your store assets, uploads, and analytics."
                action={
                  <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Icons.Plus size={16} />
                    <span>Add First Member</span>
                  </Button>
                }
              />
            </div>
          ) : filteredMembers.length === 0 ? (
            /* No Filter Results State */
            <div className="p-6 sm:p-10">
              <EmptyState
                icon={<Icons.Search size={28} className="text-on-surface-variant" />}
                title="No Matching Members"
                description="We couldn't find any team members matching your filter or search criteria."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setUserRoleFilter("all");
                      setStatusFilter("all");
                    }}
                    className="cursor-pointer text-xs"
                  >
                    Reset Filters
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              {/* Desktop Table View (≥ 768px) */}
              <div className="hidden md:block overflow-x-auto w-full overscroll-x-contain">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 text-on-surface-variant font-medium">
                      <th className="py-3.5 px-4 sm:px-6">Member</th>
                      <th className="py-3.5 px-4">Assigned Role</th>
                      <th className="py-3.5 px-4">Account Status</th>
                      <th className="py-3.5 px-4">Joined Date</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-surface-container-high/30 transition-colors duration-150"
                      >
                        {/* Member Name & Email */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container font-semibold flex items-center justify-center text-xs shrink-0 select-none shadow-xs">
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-on-surface truncate">
                                {member.name}
                              </p>
                              <p className="text-xs text-on-surface-variant truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          {renderRoleBadge(member.role_name || member.role, member.role)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {renderStatusBadge(member.status)}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-xs text-on-surface-variant whitespace-nowrap">
                          {new Date(member.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(member)}
                              className="h-8 px-2.5 text-xs cursor-pointer gap-1"
                              title="Edit role or details"
                            >
                              <Icons.Edit size={13} />
                              <span>Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(member)}
                              disabled={updateMutation.isPending}
                              className={`h-8 px-2.5 text-xs cursor-pointer ${
                                member.status === "active"
                                  ? "text-amber-600 hover:text-amber-700 dark:text-amber-400"
                                  : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                              }`}
                              title={
                                member.status === "active"
                                  ? "Suspend member access"
                                  : "Activate member access"
                              }
                            >
                              {member.status === "active" ? "Suspend" : "Activate"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingMember(member)}
                              disabled={deleteMutation.isPending}
                              className="h-8 w-8 p-0 text-error hover:bg-error/10 hover:border-error/30 cursor-pointer"
                              title="Remove from team"
                            >
                              <Icons.Trash2 size={13} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack (< 768px) */}
              <div className="md:hidden divide-y divide-outline-variant/15">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container font-semibold flex items-center justify-center text-xs shrink-0 select-none shadow-xs">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-on-surface truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {renderStatusBadge(member.status)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1">
                      <span className="font-medium">Assigned Role:</span>
                      <div>{renderRoleBadge(member.role_name || member.role, member.role)}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Joined:</span>
                      <span>
                        {new Date(member.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEdit(member)}
                        className="flex-1 text-xs h-8 cursor-pointer gap-1"
                      >
                        <Icons.Edit size={13} />
                        <span>Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(member)}
                        disabled={updateMutation.isPending}
                        className={`flex-1 text-xs h-8 cursor-pointer ${
                          member.status === "active"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {member.status === "active" ? "Suspend" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingMember(member)}
                        disabled={deleteMutation.isPending}
                        className="h-8 w-8 p-0 text-error cursor-pointer shrink-0"
                        title="Remove member"
                      >
                        <Icons.Trash2 size={13} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* ADD MEMBER MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        title="Add Store Member"
        description="Add a collaborator and assign an authorized role retrieved from the database."
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseAddModal}
              disabled={addMutation.isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-member-form"
              disabled={addMutation.isPending}
              className="flex items-center gap-2 cursor-pointer"
            >
              {addMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span>Adding Member...</span>
                </>
              ) : (
                <>
                  <Icons.Plus size={16} />
                  <span>Add Member</span>
                </>
              )}
            </Button>
          </>
        }
      >
        <form id="add-member-form" onSubmit={handleAddMember} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="add-name" className="text-xs font-medium">
              Full Name
            </Label>
            <Input
              id="add-name"
              type="text"
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              disabled={addMutation.isPending}
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="add-email" className="text-xs font-medium">
              Email Address
            </Label>
            <Input
              id="add-email"
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="alex.morgan@example.com"
              required
              disabled={addMutation.isPending}
            />
          </div>

          {/* Temporary Password */}
          <div className="space-y-1.5">
            <Label htmlFor="add-password" className="text-xs font-medium">
              Temporary Password
            </Label>
            <div className="relative">
              <Input
                id="add-password"
                type={showAddPassword ? "text" : "password"}
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="At least 4 characters"
                required
                disabled={addMutation.isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowAddPassword(!showAddPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface cursor-pointer"
                aria-label={showAddPassword ? "Hide password" : "Show password"}
              >
                {showAddPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Dynamic Role Selection */}
          <div className="space-y-2 pt-1">
            <Label htmlFor="add-role" className="text-xs font-medium">
              Store Role (Retrieved from Database)
            </Label>
            <select
              id="add-role"
              value={effectiveAddRoleId ?? ""}
              onChange={(e) => setAddRoleId(Number(e.target.value))}
              disabled={addMutation.isPending}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.slug})
                </option>
              ))}
            </select>
            {selectedAddRole && (
              <div className="p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/20 text-xs text-on-surface-variant space-y-2">
                <div className="flex items-start gap-2.5">
                  <Icons.Shield size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface">{selectedAddRole.name}</p>
                    <p className="mt-0.5 text-on-surface-variant leading-relaxed">
                      {selectedAddRole.description}
                    </p>
                  </div>
                </div>

                {/* Preview assigned permissions for this role */}
                {currentAddRolePerms.length > 0 && (
                  <div className="pt-2 border-t border-outline-variant/15">
                    <span className="font-semibold text-[11px] text-on-surface block mb-1">
                      Active Permissions Granted ({currentAddRolePerms.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {currentAddRolePerms.map((perm) => (
                        <Badge
                          key={perm}
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-0 px-1.5 font-normal"
                        >
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* EDIT MEMBER MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(editingMember)}
        onClose={handleCloseEditModal}
        title="Edit Store Member"
        description={`Modify role or status for ${editingMember?.name || "member"}.`}
        size="md"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseEditModal}
              disabled={updateMutation.isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-member-form"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 cursor-pointer"
            >
              {updateMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </>
        }
      >
        <form id="edit-member-form" onSubmit={handleEditMember} className="space-y-4">
          {/* Member Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-xs font-medium">
              Full Name
            </Label>
            <Input
              id="edit-name"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              required
              disabled={updateMutation.isPending}
            />
          </div>

          {/* Member Email (Read-only identifier) */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-email" className="text-xs font-medium">
              Email Address (Account Identifier)
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={editingMember?.email || ""}
              disabled
              className="opacity-70 cursor-not-allowed bg-surface-container-high/40"
            />
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-status" className="text-xs font-medium">
              Account Status
            </Label>
            <select
              id="edit-status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as "active" | "suspended")}
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="active">Active (Access Allowed)</option>
              <option value="suspended">Suspended (Access Blocked)</option>
            </select>
          </div>

          {/* Role Selection */}
          <div className="space-y-2 pt-1">
            <Label htmlFor="edit-role" className="text-xs font-medium">
              Assigned Role
            </Label>
            <select
              id="edit-role"
              value={editRoleId ?? ""}
              onChange={(e) => setEditRoleId(Number(e.target.value))}
              disabled={updateMutation.isPending}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name} ({role.slug})
                </option>
              ))}
            </select>
            {selectedEditRole && (
              <div className="p-3 rounded-xl bg-surface-container-high/40 border border-outline-variant/20 text-xs text-on-surface-variant space-y-2">
                <div className="flex items-start gap-2.5">
                  <Icons.Shield size={16} className="text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface">{selectedEditRole.name}</p>
                    <p className="mt-0.5 text-on-surface-variant leading-relaxed">
                      {selectedEditRole.description}
                    </p>
                  </div>
                </div>

                {/* Preview assigned permissions for this role */}
                {currentEditRolePerms.length > 0 && (
                  <div className="pt-2 border-t border-outline-variant/15">
                    <span className="font-semibold text-[11px] text-on-surface block mb-1">
                      Active Permissions Granted ({currentEditRolePerms.length}):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {currentEditRolePerms.map((perm) => (
                        <Badge
                          key={perm}
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-0 px-1.5 font-normal"
                        >
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reset Password (Optional) */}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="edit-password" className="text-xs font-medium">
              Reset Password (Optional)
            </Label>
            <div className="relative">
              <Input
                id="edit-password"
                type={showEditPassword ? "text" : "password"}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                disabled={updateMutation.isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface cursor-pointer"
                aria-label={showEditPassword ? "Hide password" : "Show password"}
              >
                {showEditPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* DELETE / REMOVE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(deletingMember)}
        onClose={() => setDeletingMember(null)}
        title="Remove Member"
        description="Are you sure you want to remove this member from your store team?"
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingMember(null)}
              disabled={deleteMutation.isPending}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 cursor-pointer"
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span>Removing...</span>
                </>
              ) : (
                <>
                  <Icons.Trash2 size={16} />
                  <span>Remove Member</span>
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-xs sm:text-sm text-on-surface-variant">
          <p>
            You are about to remove{" "}
            <strong className="text-on-surface">{deletingMember?.name}</strong> (
            {deletingMember?.email}) from your store team.
          </p>
          <p className="text-error/90 font-medium">
            This will immediately revoke their access to your Seller Studio, assets, and store
            settings.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default MembersPage;

