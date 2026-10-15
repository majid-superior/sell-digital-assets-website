// src/features/dashboard/pages/seller/SellerProductsPage.tsx
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assetService } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { formatCurrency } from "@/utils/currency.ts";
import { formatDate } from "@/utils/date.ts";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Badge, Skeleton, EmptyState } from "@/components/ui/index.ts";
import type { DigitalAsset, AssetStatus } from "@/types/asset.ts";

type StatusTab = "all" | "published" | "draft" | "archived";

export const SellerProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<StatusTab>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const limit = 15;

    const queryParams = useMemo(() => ({
        status: activeTab === "all" ? undefined : (activeTab as AssetStatus),
        search: searchQuery.trim() || undefined,
        page,
        limit,
    }), [activeTab, searchQuery, page, limit]);

    const { data: response, isLoading } = useQuery({
        queryKey: queryKeys.assets.sellerList(queryParams),
        queryFn: () => assetService.getSellerAssets(queryParams),
    });

    const assets: DigitalAsset[] = response?.items || [];
    const stats = response?.stats;
    const pagination = response?.pagination || { total: assets.length, page: 1, limit, totalPages: 1 };

    // Mutation: Transition Asset Status
    const statusMutation = useMutation({
        mutationFn: async ({ id, newStatus }: { id: string; newStatus: AssetStatus }) => {
            return assetService.updateAssetStatus(id, newStatus);
        },
        onSuccess: (updated) => {
            toast.success(`Asset status transitioned to '${updated.status}'`);
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
        },
        onError: (err) => {
            const msg = err instanceof Error ? err.message : "Failed to update asset status";
            toast.error("Status Update Failed", { description: msg });
        },
    });

    // Mutation: Soft-delete Asset
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return assetService.deleteAsset(id);
        },
        onSuccess: () => {
            toast.success("Asset archived and soft-deleted");
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
        },
        onError: (err) => {
            const msg = err instanceof Error ? err.message : "Failed to delete asset";
            toast.error("Deletion Failed", { description: msg });
        },
    });

    const handleToggleStatus = (asset: DigitalAsset) => {
        const nextStatus: AssetStatus = asset.status === "published" ? "draft" : "pending";
        statusMutation.mutate({ id: asset.id, newStatus: nextStatus });
    };

    const handleDelete = (id: string, title: string) => {
        if (window.confirm(`Are you sure you want to archive "${title}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    const statusBadgeVariant = (status: AssetStatus): "default" | "primary" | "secondary" | "success" | "warning" | "error" | "outline" => {
        switch (status) {
            case "published":
                return "primary";
            case "draft":
                return "outline";
            case "pending":
            case "under_review":
                return "warning";
            case "needs_update":
                return "secondary";
            case "rejected":
            case "archived":
                return "error";
            default:
                return "outline";
        }
    };

    return (
        <div className="space-y-6 animate-fade-in w-full">
            {/* Header with Title and Create Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-outline-variant/30">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                        Seller Products &amp; Catalog
                    </h1>
                    <p className="text-xs text-on-surface-variant mt-1">
                        Manage your digital products, file deliverables, release versions, and pricing tiers.
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate("/dashboard/seller/products/upload/files")}
                    leftIcon={<Icons.Plus size={16} />}
                    className="cursor-pointer shrink-0"
                >
                    Create New Asset
                </Button>
            </div>

            {/* Performance Stats Cards (if available from backend and assets exist) */}
            {stats && stats.totalAssets > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                        <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Total Assets</span>
                        <div className="text-2xl font-extrabold text-on-surface mt-1">{stats.totalAssets}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                        <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Published</span>
                        <div className="text-2xl font-extrabold text-primary mt-1">{stats.publishedAssets}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                        <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Total Views</span>
                        <div className="text-2xl font-extrabold text-on-surface mt-1">{stats.totalViews}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                        <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Downloads</span>
                        <div className="text-2xl font-extrabold text-on-surface mt-1">{stats.totalDownloads}</div>
                    </div>
                </div>
            )}

            {/* Tab Navigation & Search Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                {/* Status Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    {(["all", "published", "draft", "archived"] as StatusTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => {
                                setActiveTab(tab);
                                setPage(1);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                                activeTab === tab
                                    ? "bg-surface text-primary shadow-xs font-bold"
                                    : "text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative min-w-[240px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                        <Icons.Search size={14} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setPage(1);
                        }}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-surface border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary"
                    />
                </div>
            </div>

            {/* Products Table Container */}
            <div className="rounded-2xl border border-outline-variant/30 bg-surface overflow-hidden shadow-xs">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 5 }, (_, i) => (
                            <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-outline-variant/20 last:border-b-0">
                                <div className="flex items-center gap-3">
                                    <Skeleton variant="rectangular" width={48} height={48} className="rounded-xl shrink-0" />
                                    <div className="space-y-1">
                                        <Skeleton variant="text" width={180} height={16} />
                                        <Skeleton variant="text" width={100} height={12} />
                                    </div>
                                </div>
                                <Skeleton variant="text" width={80} height={16} />
                                <Skeleton variant="text" width={60} height={20} className="rounded-full" />
                                <Skeleton variant="rectangular" width={100} height={32} className="rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : assets.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant font-semibold">
                                    <th className="py-3 px-4">Asset</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Pricing</th>
                                    <th className="py-3 px-4 text-center">Views</th>
                                    <th className="py-3 px-4 text-center">Downloads</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                                {assets.map((item) => {
                                    const thumbnail = item.media?.find((m) => m.media_type === "thumbnail")?.url || item.thumbnailUrl;
                                    const minPrice = item.min_price ?? (item.tiers?.[0]?.price ?? 0);
                                    const categoryName = typeof item.category === "object" ? item.category?.name : (item.category || "General");

                                    return (
                                        <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                                            {/* Thumbnail & Title */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    {thumbnail ? (
                                                        <img
                                                            src={thumbnail}
                                                            alt={item.title}
                                                            loading="lazy"
                                                            className="w-12 h-12 rounded-xl object-cover border border-outline-variant/30 shrink-0 bg-surface-container"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl bg-surface-container border border-outline-variant/30 flex items-center justify-center shrink-0 text-on-surface-variant">
                                                            <Icons.Package size={20} className="text-primary" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0 max-w-[240px]">
                                                        <Link
                                                            to={`/asset/${item.slug}`}
                                                            className="font-bold text-on-surface hover:text-primary transition-colors line-clamp-1"
                                                        >
                                                            {item.title}
                                                        </Link>
                                                        <span className="text-[11px] text-on-surface-variant block mt-0.5">
                                                            Updated {formatDate(item.updated_at || item.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="py-3.5 px-4 font-medium text-on-surface-variant">
                                                {categoryName}
                                            </td>

                                            {/* Pricing */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-extrabold text-on-surface">
                                                    {formatCurrency(minPrice)}
                                                </div>
                                                <span className="text-[10px] text-on-surface-variant">
                                                    {item.tiers?.length || 0} tier{(item.tiers?.length || 0) !== 1 ? "s" : ""}
                                                </span>
                                            </td>

                                            {/* Views */}
                                            <td className="py-3.5 px-4 text-center text-on-surface-variant font-mono">
                                                {item.view_count || 0}
                                            </td>

                                            {/* Downloads */}
                                            <td className="py-3.5 px-4 text-center text-on-surface-variant font-mono">
                                                {item.download_count || 0}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-4">
                                                <Badge
                                                    variant={statusBadgeVariant(item.status)}
                                                    size="sm"
                                                    className="capitalize font-semibold text-[10px]"
                                                >
                                                    {item.status.replace(/_/g, " ")}
                                                </Badge>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(item)}
                                                        disabled={item.status === "pending"}
                                                        title={
                                                            item.status === "published"
                                                                ? "Unpublish to draft"
                                                                : item.status === "pending"
                                                                ? "Asset is pending admin review"
                                                                : "Submit for Admin Review"
                                                        }
                                                        isLoading={statusMutation.isPending && statusMutation.variables?.id === item.id}
                                                        className="text-xs px-2.5 py-1 cursor-pointer"
                                                    >
                                                        {item.status === "published"
                                                            ? "Unpublish"
                                                            : item.status === "pending"
                                                            ? "In Review"
                                                            : "Submit"}
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate(`/asset/${item.slug}`)}
                                                        title="Preview Live Page"
                                                        className="p-1.5 cursor-pointer"
                                                    >
                                                        <Icons.ExternalLink size={14} />
                                                    </Button>

                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(item.id, item.title)}
                                                        title="Archive Asset"
                                                        isLoading={deleteMutation.isPending && deleteMutation.variables === item.id}
                                                        className="p-1.5 cursor-pointer"
                                                    >
                                                        <Icons.Close size={14} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <EmptyState
                            title="No assets found"
                            description={
                                searchQuery
                                    ? `No assets match your search term "${searchQuery}".`
                                    : activeTab !== "all"
                                    ? `You have no assets currently in '${activeTab}' status.`
                                    : "You haven't created any digital assets yet. Start publishing your work!"
                            }
                            icon={<Icons.Package size={36} />}
                            action={
                                <Button
                                    variant="primary"
                                    size="md"
                                    onClick={() => navigate("/dashboard/seller/products/upload/files")}
                                    className="cursor-pointer"
                                >
                                    Create First Asset
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex justify-between items-center text-xs text-on-surface-variant pt-2">
                    <span>
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            className="cursor-pointer"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= pagination.totalPages}
                            onClick={() => setPage(page + 1)}
                            className="cursor-pointer"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerProductsPage;
