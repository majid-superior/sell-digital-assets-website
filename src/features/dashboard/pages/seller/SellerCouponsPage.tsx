// src/features/dashboard/pages/seller/SellerCouponsPage.tsx
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/Button.tsx";
import { Input } from "@/components/ui/Input.tsx";
import { Label } from "@/components/ui/Label.tsx";
import { Badge } from "@/components/ui/Badge.tsx";
import { Card } from "@/components/ui/Card.tsx";
import { EmptyState } from "@/components/ui/EmptyState.tsx";
import { Modal } from "@/components/ui/Modal.tsx";
import { Skeleton } from "@/components/ui/Skeleton.tsx";
import {
  couponService,
  buildCouponShareMessage,
} from "@/services/v1/couponService.ts";
import type {
  Coupon,
  CouponStatus,
  CreateCouponPayload,
  UpdateCouponPayload,
} from "@/types/coupon.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { getHumanErrorMessage } from "@/utils/errors.ts";
import { copyToClipboard } from "@/utils/clipboard.ts";

const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Coupon code must be at least 3 characters")
      .max(50, "Coupon code cannot exceed 50 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Code must contain only alphanumeric characters, dashes, and underscores",
      ),
    discountPercent: z
      .number({ message: "Discount percentage is required" })
      .int("Discount percentage must be an integer")
      .min(1, "Discount percentage must be at least 1%")
      .max(90, "Discount percentage cannot exceed 90%"),
    startsAt: z.string().min(1, "Start date and time is required"),
    endsAt: z.string().min(1, "End date and time is required"),
    usageLimit: z.number().int().positive().nullable().optional(),
    description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => new Date(data.endsAt).getTime() > new Date(data.startsAt).getTime(), {
    message: "End date must be strictly after the start date",
    path: ["endsAt"],
  });

function formatIsoForDateTimeInput(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

interface CouponFormData {
  code: string;
  discountPercent: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  description: string;
  isActive: boolean;
}

function getDefaultCouponFormData(): CouponFormData {
  const now = new Date();
  const future = new Date(now.getTime() + 30 * 86400_000);
  return {
    code: "",
    discountPercent: "20",
    startsAt: formatIsoForDateTimeInput(now.toISOString()),
    endsAt: formatIsoForDateTimeInput(future.toISOString()),
    usageLimit: "",
    description: "",
    isActive: true,
  };
}

export const SellerCouponsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<CouponStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"created_at" | "code" | "discount_percent" | "ends_at" | "usage_count">("created_at");

  // Fetch Coupons
  const { data: couponsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: queryKeys.coupons.sellerList({ search: searchQuery, status: statusFilter, sortBy }),
    queryFn: () =>
      couponService.getCoupons({
        search: searchQuery.trim() || undefined,
        status: statusFilter,
        sortBy,
        sortOrder: "desc",
      }),
  });

  const coupons = couponsResponse?.data || [];
  const metrics = couponsResponse?.metrics || {
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    totalDiscountAmount: 0,
  };

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [formData, setFormData] = useState<CouponFormData>(getDefaultCouponFormData);

  // Open Create Modal
  const openCreateModal = () => {
    setFormData(getDefaultCouponFormData());
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountPercent: String(coupon.discount_percent),
      startsAt: formatIsoForDateTimeInput(coupon.starts_at),
      endsAt: formatIsoForDateTimeInput(coupon.ends_at),
      usageLimit: coupon.usage_limit != null ? String(coupon.usage_limit) : "",
      description: coupon.description || "",
      isActive: coupon.is_active,
    });
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: CreateCouponPayload) => couponService.createCoupon(payload),
    onSuccess: (newCoupon) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      setIsCreateModalOpen(false);
      toast.success("Coupon Created", {
        description: `Coupon "${newCoupon.code}" offering ${newCoupon.discount_percent}% off has been created.`,
      });
    },
    onError: (err) => {
      toast.error("Failed to Create Coupon", {
        description: getHumanErrorMessage(err, "Could not create coupon. Please check your inputs."),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCouponPayload }) =>
      couponService.updateCoupon(id, payload),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      setEditingCoupon(null);
      toast.success("Coupon Updated", {
        description: `Coupon "${updated.code}" has been updated successfully.`,
      });
    },
    onError: (err) => {
      toast.error("Failed to Update Coupon", {
        description: getHumanErrorMessage(err, "Could not update coupon. Please check your inputs."),
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      couponService.toggleStatus(id, isActive),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      toast.success(updated.is_active ? "Coupon Activated" : "Coupon Deactivated", {
        description: `Coupon "${updated.code}" is now ${updated.is_active ? "active" : "inactive"}.`,
      });
    },
    onError: (err) => {
      toast.error("Status Change Failed", {
        description: getHumanErrorMessage(err, "Could not update coupon status."),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponService.deleteCoupon(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all });
      setDeletingCoupon(null);
      toast.success("Coupon Deleted", {
        description: "The coupon has been permanently removed.",
      });
    },
    onError: (err) => {
      toast.error("Cannot Delete Coupon", {
        description: getHumanErrorMessage(err, "Failed to delete coupon."),
      });
    },
  });

  // Handle Form Submission
  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();

    const rawDiscount = parseInt(formData.discountPercent, 10);
    const parsedLimit = formData.usageLimit.trim() === "" ? null : parseInt(formData.usageLimit, 10);

    const validationResult = couponFormSchema.safeParse({
      code: formData.code,
      discountPercent: isNaN(rawDiscount) ? undefined : rawDiscount,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : "",
      endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : "",
      usageLimit: parsedLimit,
      description: formData.description || undefined,
      isActive: formData.isActive,
    });

    if (!validationResult.success) {
      const firstIssue = validationResult.error.issues[0];
      toast.error("Validation Error", {
        description: firstIssue?.message || "Please check your form inputs.",
      });
      return;
    }

    const validData = validationResult.data;

    if (editingCoupon) {
      updateMutation.mutate({
        id: editingCoupon.id,
        payload: {
          discountPercent: validData.discountPercent,
          startsAt: validData.startsAt,
          endsAt: validData.endsAt,
          usageLimit: validData.usageLimit,
          description: validData.description,
          isActive: validData.isActive,
        },
      });
    } else {
      createMutation.mutate({
        code: validData.code,
        discountPercent: validData.discountPercent,
        startsAt: validData.startsAt,
        endsAt: validData.endsAt,
        usageLimit: validData.usageLimit,
        description: validData.description,
        isActive: validData.isActive,
      });
    }
  };

  // Copy Promotional Share Message
  const handleCopyShareMessage = async (coupon: Coupon) => {
    const shareMessage = buildCouponShareMessage(coupon);
    const copied = await copyToClipboard(shareMessage);
    if (copied) {
      toast.success("Share Message Copied", {
        description: `Ready-to-share promotional message for "${coupon.code}" copied to clipboard!`,
      });
    } else {
      toast.error("Clipboard Error", {
        description: "Unable to access clipboard. Please copy the coupon code manually.",
      });
    }
  };

  // Badge Status Styling
  const renderStatusBadge = (status: CouponStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="primary" size="sm" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
            Active
          </Badge>
        );
      case "scheduled":
        return (
          <Badge variant="secondary" size="sm" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
            Scheduled
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="outline" size="sm" className="opacity-70">
            Expired
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" size="sm" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
            Inactive
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Coupons & Discounts
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Create and manage promotional discount codes applicable to your store's digital assets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
            leftIcon={<Icons.RotateCcw size={16} className={isFetching ? "animate-spin" : ""} />}
            aria-label="Refresh coupons"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            leftIcon={<Icons.Plus size={16} />}
            aria-label="Create new coupon"
          >
            Create Coupon
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </>
        ) : (
          <>
            <Card className="rounded-2xl border border-outline-variant/30 p-4 transition-colors">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Coupons</span>
                <Icons.Sell size={18} className="text-primary" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                {metrics.totalCoupons}
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">Created promotional codes</span>
            </Card>

            <Card className="rounded-2xl border border-outline-variant/30 p-4 transition-colors">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Codes</span>
                <Icons.Success size={18} className="text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {metrics.activeCoupons}
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">Eligible for checkout now</span>
            </Card>

            <Card className="rounded-2xl border border-outline-variant/30 p-4 transition-colors">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Redemptions</span>
                <Icons.Cart size={18} className="text-sky-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                {metrics.totalRedemptions}
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">Successful buyer checkouts</span>
            </Card>

            <Card className="rounded-2xl border border-outline-variant/30 p-4 transition-colors">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Discount Given</span>
                <Icons.Wallet size={18} className="text-primary" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-primary">
                ${metrics.totalDiscountAmount.toFixed(2)}
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1 block">Total customer savings</span>
            </Card>
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="rounded-2xl border border-outline-variant/30 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
              <Icons.Search size={16} />
            </div>
            <Input
              type="text"
              placeholder="Search by code or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full text-sm"
              aria-label="Search coupons"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <Label htmlFor="coupon-sort-select" className="text-xs text-on-surface-variant whitespace-nowrap">
              Sort by:
            </Label>
            <select
              id="coupon-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "created_at" | "code" | "discount_percent" | "ends_at" | "usage_count")}
              className="h-10 px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface text-on-surface text-xs focus:ring-2 focus:ring-primary focus:outline-hidden"
              aria-label="Sort coupons"
            >
              <option value="created_at">Recently Created</option>
              <option value="ends_at">Expiring Soonest</option>
              <option value="discount_percent">Highest Discount</option>
              <option value="usage_count">Most Redemptions</option>
              <option value="code">Code Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {(["all", "active", "scheduled", "expired", "inactive"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Coupons List / Table */}
      {isLoading ? (
        <Card className="rounded-2xl border border-outline-variant/30 p-4 sm:p-6 space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </Card>
      ) : coupons.length === 0 ? (
        <Card className="rounded-2xl border border-outline-variant/30 p-8">
          <EmptyState
            icon={<Icons.Sell size={40} className="text-primary" />}
            title={searchQuery || statusFilter !== "all" ? "No matching coupons found" : "No coupons created yet"}
            description={
              searchQuery || statusFilter !== "all"
                ? "Try clearing your search query or switching to a different status filter."
                : "Create your first discount coupon to incentivize buyers and increase sales across your store's digital assets."
            }
            action={
              searchQuery || statusFilter !== "all" ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                >
                  Reset Filters
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={openCreateModal} leftIcon={<Icons.Plus size={16} />}>
                  Create First Coupon
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <Card className="rounded-2xl border border-outline-variant/30 overflow-hidden shadow-xs">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto w-full overscroll-x-contain">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Validity Period</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-on-surface">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-surface-container-lowest/60 transition-colors">
                    <td className="py-4 px-4 min-w-45">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary tracking-wide text-sm bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                          {coupon.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            void handleCopyShareMessage(coupon);
                          }}
                          title="Copy ready-to-share message"
                          className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                          aria-label={`Copy promotional message for ${coupon.code}`}
                        >
                          <Icons.Copy size={15} />
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-xs text-on-surface-variant mt-1 max-w-xs truncate" title={coupon.description}>
                          {coupon.description}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4 font-extrabold text-base text-on-surface whitespace-nowrap">
                      {coupon.discount_percent}% OFF
                    </td>

                    <td className="py-4 px-4 text-xs whitespace-nowrap">
                      <div className="text-on-surface font-medium">Until {formatDate(coupon.ends_at)}</div>
                      <div className="text-on-surface-variant text-[11px]">From {formatDate(coupon.starts_at)}</div>
                    </td>

                    <td className="py-4 px-4 text-xs whitespace-nowrap">
                      <span className="font-semibold text-on-surface">
                        {coupon.usage_count}
                      </span>
                      <span className="text-on-surface-variant">
                        {" "}
                        / {coupon.usage_limit != null ? coupon.usage_limit : "∞"}
                      </span>
                      {coupon.usage_limit != null && (
                        <div className="w-24 bg-surface-container rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, (coupon.usage_count / coupon.usage_limit) * 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {renderStatusBadge(coupon.status)}
                    </td>

                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void handleCopyShareMessage(coupon);
                          }}
                          className="text-xs h-8 px-2.5 text-primary hover:bg-primary/10"
                          leftIcon={<Icons.Share size={14} />}
                        >
                          Share
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatusMutation.mutate({ id: coupon.id, isActive: !coupon.is_active })}
                          disabled={toggleStatusMutation.isPending}
                          className="text-xs h-8 px-2 text-on-surface-variant hover:text-on-surface"
                        >
                          {coupon.is_active ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(coupon)}
                          className="text-xs h-8 px-2 text-on-surface-variant hover:text-on-surface"
                          aria-label={`Edit ${coupon.code}`}
                        >
                          <Icons.Edit size={14} />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingCoupon(coupon)}
                          className="text-xs h-8 px-2 text-error hover:bg-error/10"
                          aria-label={`Delete ${coupon.code}`}
                        >
                          <Icons.Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack */}
          <div className="block md:hidden divide-y divide-outline-variant/20">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary tracking-wide text-sm bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                      {coupon.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyShareMessage(coupon);
                      }}
                      className="p-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                      aria-label="Copy share message"
                    >
                      <Icons.Copy size={16} />
                    </button>
                  </div>
                  {renderStatusBadge(coupon.status)}
                </div>

                {coupon.description && (
                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {coupon.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-outline-variant/10">
                  <div>
                    <span className="text-on-surface-variant block text-[11px]">Discount</span>
                    <strong className="text-base font-extrabold text-on-surface">
                      {coupon.discount_percent}% OFF
                    </strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant block text-[11px]">Redemptions</span>
                    <strong className="font-semibold text-on-surface">
                      {coupon.usage_count} / {coupon.usage_limit != null ? coupon.usage_limit : "∞"}
                    </strong>
                  </div>
                </div>

                <div className="text-[11px] text-on-surface-variant">
                  Valid: {formatDate(coupon.starts_at)} – {formatDate(coupon.ends_at)}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-outline-variant/10">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void handleCopyShareMessage(coupon);
                    }}
                    className="flex-1 text-xs"
                    leftIcon={<Icons.Share size={14} />}
                  >
                    Share
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(coupon)}
                    className="text-xs px-2.5"
                  >
                    <Icons.Edit size={14} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatusMutation.mutate({ id: coupon.id, isActive: !coupon.is_active })}
                    className="text-xs px-2.5 text-on-surface-variant"
                  >
                    {coupon.is_active ? "Deactivate" : "Activate"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingCoupon(coupon)}
                    className="text-xs px-2.5 text-error"
                  >
                    <Icons.Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create / Edit Coupon Modal */}
      <Modal
        isOpen={isCreateModalOpen || editingCoupon !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingCoupon(null);
        }}
        title={editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
        className="max-w-md w-full"
      >
        <form onSubmit={handleSaveCoupon} className="space-y-4 p-4 sm:p-6">
          {/* Code */}
          <div>
            <Label htmlFor="coupon-code" className="text-xs font-semibold text-on-surface block mb-1">
              Coupon Code *
            </Label>
            <Input
              id="coupon-code"
              type="text"
              disabled={Boolean(editingCoupon)}
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, "") }))}
              placeholder="e.g. SUMMER25"
              className="font-mono uppercase font-bold tracking-wider"
              required
            />
            <span className="text-[11px] text-on-surface-variant mt-1 block">
              Uppercase letters, numbers, and hyphens (3–50 chars). Globally unique.
            </span>
          </div>

          {/* Discount Percentage */}
          <div>
            <Label htmlFor="coupon-discount" className="text-xs font-semibold text-on-surface block mb-1">
              Percentage Discount (1% – 90%) *
            </Label>
            <div className="relative">
              <Input
                id="coupon-discount"
                type="number"
                min="1"
                max="90"
                step="1"
                value={formData.discountPercent}
                onChange={(e) => setFormData((prev) => ({ ...prev, discountPercent: e.target.value }))}
                placeholder="20"
                required
                className="pr-8"
              />
              <span className="absolute right-3 top-2.5 text-sm font-bold text-on-surface-variant pointer-events-none">
                %
              </span>
            </div>
          </div>

          {/* Date Validity Windows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="coupon-starts-at" className="text-xs font-semibold text-on-surface block mb-1">
                Start Date/Time *
              </Label>
              <Input
                id="coupon-starts-at"
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, startsAt: e.target.value }))}
                required
                className="text-xs"
              />
            </div>
            <div>
              <Label htmlFor="coupon-ends-at" className="text-xs font-semibold text-on-surface block mb-1">
                End Date/Time *
              </Label>
              <Input
                id="coupon-ends-at"
                type="datetime-local"
                value={formData.endsAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, endsAt: e.target.value }))}
                required
                className="text-xs"
              />
            </div>
          </div>

          {/* Usage Limit */}
          <div>
            <Label htmlFor="coupon-usage-limit" className="text-xs font-semibold text-on-surface block mb-1">
              Max Redemptions (Optional)
            </Label>
            <Input
              id="coupon-usage-limit"
              type="number"
              min="1"
              step="1"
              value={formData.usageLimit}
              onChange={(e) => setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))}
              placeholder="Leave empty for unlimited redemptions"
            />
            <span className="text-[11px] text-on-surface-variant mt-1 block">
              Leave blank to allow unlimited redemptions during the validity window.
            </span>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="coupon-description" className="text-xs font-semibold text-on-surface block mb-1">
              Description (Optional)
            </Label>
            <textarea
              id="coupon-description"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="e.g. Exclusive spring promotional campaign for Twitter followers"
              className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant/40 bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:outline-hidden resize-none"
              maxLength={500}
            />
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="coupon-is-active"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
            />
            <Label htmlFor="coupon-is-active" className="text-xs text-on-surface cursor-pointer select-none font-medium">
              Activate coupon immediately upon saving
            </Label>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t border-outline-variant/20">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingCoupon(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCoupon ? "Save Changes" : "Create Coupon"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingCoupon !== null}
        onClose={() => setDeletingCoupon(null)}
        title="Delete Coupon"
        className="max-w-md w-full"
      >
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-on-surface">
            Are you sure you want to delete coupon{" "}
            <strong className="font-mono text-primary">{deletingCoupon?.code}</strong>?
          </p>

          {deletingCoupon && deletingCoupon.usage_count > 0 ? (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400">
              <Icons.AlertCircle size={16} className="inline mr-1" />
              This coupon has <strong>{deletingCoupon.usage_count}</strong> active redemption record(s). To preserve order audit history, you cannot permanently delete it. Deactivate it instead to stop future redemptions.
            </div>
          ) : (
            <p className="text-xs text-on-surface-variant">
              This action cannot be undone. Once deleted, this coupon code can no longer be redeemed.
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="md" onClick={() => setDeletingCoupon(null)}>
              Cancel
            </Button>
            {deletingCoupon && deletingCoupon.usage_count > 0 ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  toggleStatusMutation.mutate({ id: deletingCoupon.id, isActive: false });
                  setDeletingCoupon(null);
                }}
              >
                Deactivate Instead
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="md"
                isLoading={deleteMutation.isPending}
                onClick={() => deletingCoupon && deleteMutation.mutate(deletingCoupon.id)}
              >
                Delete Permanently
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
