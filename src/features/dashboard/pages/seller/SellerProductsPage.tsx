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
import { Button, Badge, Skeleton, EmptyState, Modal } from "@/components/ui/index.ts";
import { useDebounce } from "@/hooks/useDebounce.ts";
import { copyToClipboard, getAssetPublicUrl } from "@/utils/clipboard.ts";
import type { DigitalAsset, AssetStatus } from "@/types/asset.ts";

type StatusTab = "all" | "published" | "pending" | "needs_update" | "rejected" | "draft" | "archived";

const STATUS_TABS: Array<{ id: StatusTab; label: string }> = [
    { id: "all", label: "All" },
    { id: "published", label: "Published" },
    { id: "pending", label: "Pending Review" },
    { id: "needs_update", label: "Needs Update" },
    { id: "rejected", label: "Rejected" },
    { id: "draft", label: "Draft" },
    { id: "archived", label: "Archived" },
];

export const SellerProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [assetToDelete, setAssetToDelete] = useState<{ id: string; title: string } | null>(null);
    const [replyingAsset, setReplyingAsset] = useState<DigitalAsset | null>(null);
    const [sellerReply, setSellerReply] = useState<string>("");
    const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<StatusTab>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 350);
    const [page, setPage] = useState(1);
    const limit = 15;

    const queryParams = useMemo(() => ({
        status: activeTab === "all" ? undefined : (activeTab as AssetStatus),
        search: debouncedSearch.trim() || undefined,
        page,
        limit,
    }), [activeTab, debouncedSearch, page, limit]);

    const { data: response, isLoading } = useQuery({
        queryKey: queryKeys.assets.sellerList(queryParams),
        queryFn: () => assetService.getSellerAssets(queryParams),
    });

    const assets: DigitalAsset[] = response?.items || [];
    const stats = response?.stats;
    const pagination = response?.pagination || { total: assets.length, page: 1, limit, totalPages: 1 };

    // Mutation: Transition Asset Status (with optional seller reply/revision notes)
    const statusMutation = useMutation({
        mutationFn: async ({
            id,
            newStatus,
            feedback,
        }: {
            id: string;
            newStatus: AssetStatus;
            feedback?: string;
        }) => {
            return assetService.updateAssetStatus(id, newStatus, feedback);
        },
        onSuccess: (updated) => {
            const label =
                updated.status === "pending"
                    ? "Asset submitted for admin review"
                    : `Asset status transitioned to '${updated.status}'`;
            toast.success(label);
            setReplyingAsset(null);
            setSellerReply("");
            void queryClient.invalidateQueries({ queryKey: queryKeys.assets.all });
            void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
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
        if (asset.status === "needs_update" || asset.status === "rejected" || asset.admin_feedback) {
            setReplyingAsset(asset);
            setSellerReply(asset.seller_feedback || "");
            return;
        }
        const nextStatus: AssetStatus = asset.status === "published" ? "draft" : "pending";
        statusMutation.mutate({ id: asset.id, newStatus: nextStatus });
    };

    const handleOpenFeedbackModal = (asset: DigitalAsset) => {
        setReplyingAsset(asset);
        setSellerReply(asset.seller_feedback || "");
    };

    const handleConfirmResubmit = () => {
        if (!replyingAsset) return;
        statusMutation.mutate({
            id: replyingAsset.id,
            newStatus: "pending",
            feedback: sellerReply.trim() || undefined,
        });
    };

    const handleDelete = (id: string, title: string) => {
        setAssetToDelete({ id, title });
    };

    const confirmDelete = () => {
        if (assetToDelete) {
            deleteMutation.mutate(assetToDelete.id);
            setAssetToDelete(null);
        }
    };

    const handleCopyShareLink = async (item: DigitalAsset) => {
        // Enforce marketplace access rules: unpublished/draft/pending/rejected/archived assets cannot be publicly accessed
        if (item.status !== "published") {
            const statusLabel = item.status.replace(/_/g, " ");
            toast.error("Cannot Share Unpublished Asset", {
                description: `This asset is currently "${statusLabel}". Only approved and published assets can be viewed by public buyers.`,
            });
            return;
        }

        const shareUrl = getAssetPublicUrl(item);

        const success = await copyToClipboard(shareUrl);
        if (success) {
            setCopiedAssetId(item.id);
            toast.success("Share link copied to clipboard", {
                description: shareUrl,
            });
            setTimeout(() => {
                setCopiedAssetId((prev) => (prev === item.id ? null : prev));
            }, 2000);
        } else {
            toast.error("Failed to Copy Link", {
                description: "Clipboard access was denied by your browser. Please copy the URL manually.",
            });
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

    const getTabCount = (tabId: StatusTab): number | undefined => {
        if (!stats) return undefined;
        switch (tabId) {
            case "all":
                return stats.totalAssets;
            case "published":
                return stats.publishedAssets;
            case "pending":
                return stats.pendingAssets;
            case "needs_update":
                return stats.needsUpdateAssets;
            case "rejected":
                return stats.rejectedAssets;
            case "draft":
                return stats.draftAssets;
            case "archived":
                return stats.archivedAssets;
            default:
                return undefined;
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
                        Manage your digital products, file deliverables, release versions, and admin review feedback.
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

            {/* Performance Stats Cards */}
            {stats && stats.totalAssets > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                        <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Total Assets</span>
                        <div className="text-2xl font-extrabold text-on-surface mt-1">{stats.totalAssets}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                        <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Published</span>
                        <div className="text-2xl font-extrabold text-primary mt-1">{stats.publishedAssets ?? 0}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                        <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Pending Review</span>
                        <div className="text-2xl font-extrabold text-on-surface mt-1">{stats.pendingAssets ?? 0}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30">
                        <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Total Views</span>
                        <div className="text-2xl font-extrabold text-on-surface mt-1">{stats.totalViews}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 col-span-2 sm:col-span-1">
                        <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Downloads</span>
                        <div className="text-2xl font-extrabold text-on-surface mt-1">{stats.totalDownloads}</div>
                    </div>
                </div>
            )}

            {/* Tab Navigation & Search Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
                {/* Status Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    {STATUS_TABS.map((tab) => {
                        const count = getTabCount(tab.id);
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    setPage(1);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === tab.id
                                        ? "bg-surface text-primary shadow-xs font-bold"
                                        : "text-on-surface-variant hover:text-on-surface"
                                }`}
                            >
                                <span>{tab.label}</span>
                                {typeof count === "number" && count > 0 && (
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            activeTab === tab.id
                                                ? "bg-primary/15 text-primary"
                                                : "bg-surface-container-high text-on-surface-variant"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <div className="relative min-w-60">
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
                    <div className="overflow-x-auto w-full overscroll-x-contain">
                        <table className="w-full min-w-[640px] sm:min-w-0 text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-outline-variant/30 bg-surface-container-low text-on-surface-variant font-semibold">
                                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Asset</th>
                                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Category</th>
                                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Pricing</th>
                                    <th className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">Views</th>
                                    <th className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">Downloads</th>
                                    <th className="py-3 px-3 sm:px-4 whitespace-nowrap">Status &amp; Review Feedback</th>
                                    <th className="py-3 px-3 sm:px-4 text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/20">
                                {assets.map((item) => {
                                    const thumbnail =
                                        item.media?.find((m) => m.media_type === "thumbnail")?.url ||
                                        item.thumbnail_url ||
                                        item.thumbnailUrl;
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
                                                    <div className="min-w-0 max-w-60">
                                                        <Link
                                                            to={
                                                                item.status === "published"
                                                                    ? `/asset/${item.slug}`
                                                                    : `/dashboard/seller/products/edit/${item.id}`
                                                            }
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

                                            {/* Status Badge & Admin Feedback Snippet */}
                                            <td className="py-3.5 px-4 max-w-65">
                                                <div className="flex flex-col items-start gap-1.5">
                                                    <Badge
                                                        variant={statusBadgeVariant(item.status)}
                                                        size="sm"
                                                        className="capitalize font-semibold text-[10px]"
                                                    >
                                                        {item.status.replace(/_/g, " ")}
                                                    </Badge>

                                                    {item.admin_feedback && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenFeedbackModal(item)}
                                                            className="text-left p-2 rounded-lg border border-outline-variant/40 bg-surface-container-low hover:border-primary/40 transition-colors cursor-pointer w-full"
                                                        >
                                                            <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-primary">
                                                                <span>Admin Feedback</span>
                                                                <span className="underline">Reply / View</span>
                                                            </div>
                                                            <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                                                                {item.admin_feedback}
                                                            </p>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        variant={
                                                            item.status === "needs_update" || item.status === "rejected"
                                                                ? "primary"
                                                                : "ghost"
                                                        }
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(item)}
                                                        disabled={item.status === "pending" && !item.admin_feedback}
                                                        title={
                                                            item.status === "published"
                                                                ? "Unpublish to draft"
                                                                : item.status === "pending"
                                                                ? "Asset is pending admin review"
                                                                : item.status === "needs_update" || item.status === "rejected"
                                                                ? "Respond to admin feedback and resubmit"
                                                                : "Submit for Admin Review"
                                                        }
                                                        isLoading={statusMutation.isPending && statusMutation.variables?.id === item.id}
                                                        className="text-xs px-2.5 py-1 cursor-pointer"
                                                    >
                                                        {item.status === "published"
                                                            ? "Unpublish"
                                                            : item.status === "pending"
                                                            ? item.admin_feedback
                                                                ? "Update Note"
                                                                : "In Review"
                                                            : item.status === "needs_update" || item.status === "rejected"
                                                            ? "Reply & Resubmit"
                                                            : "Submit"}
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => navigate(`/dashboard/seller/products/edit/${item.id}`)}
                                                        title="Edit Product"
                                                        className="p-1.5 cursor-pointer text-foreground hover:text-primary"
                                                    >
                                                        <Icons.Edit size={14} />
                                                    </Button>

                                                    {/* Copy Share Link */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => void handleCopyShareLink(item)}
                                                        title={
                                                            item.status === "published"
                                                                ? copiedAssetId === item.id
                                                                    ? "Share link copied!"
                                                                    : "Copy Share Link"
                                                                : `Cannot share: Asset is ${item.status.replace(/_/g, " ")}`
                                                        }
                                                        aria-label={
                                                            item.status === "published"
                                                                ? `Copy share link for ${item.title}`
                                                                : `Cannot share ${item.title} (status: ${item.status.replace(/_/g, " ")})`
                                                        }
                                                        className={`p-1.5 cursor-pointer ${
                                                            item.status === "published"
                                                                ? copiedAssetId === item.id
                                                                    ? "text-primary border-primary/40 bg-primary/10"
                                                                    : "text-foreground hover:text-primary"
                                                                : "opacity-50 text-on-surface-variant hover:text-on-surface"
                                                        }`}
                                                    >
                                                        {copiedAssetId === item.id ? (
                                                            <Icons.Check size={14} className="text-primary" />
                                                        ) : (
                                                            <Icons.Link size={14} />
                                                        )}
                                                    </Button>

                                                    {item.status === "published" && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => navigate(`/asset/${item.slug}`)}
                                                            title="Preview Live Page"
                                                            className="p-1.5 cursor-pointer"
                                                        >
                                                            <Icons.ExternalLink size={14} />
                                                        </Button>
                                                    )}

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
                                    ? `You have no assets currently in '${activeTab.replace(/_/g, " ")}' status.`
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

            {/* Admin Feedback & Seller Reply / Resubmit Modal */}
            <Modal
                isOpen={Boolean(replyingAsset)}
                onClose={() => {
                    setReplyingAsset(null);
                    setSellerReply("");
                }}
                title={
                    replyingAsset?.status === "rejected"
                        ? "Admin Rejection Feedback & Resubmission"
                        : replyingAsset?.status === "needs_update"
                        ? "Admin Update Request & Seller Response"
                        : "Admin Review Feedback & Notes"
                }
            >
                {replyingAsset && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-outline-variant/25">
                            <span className="font-bold text-sm text-on-surface truncate">
                                {replyingAsset.title}
                            </span>
                            <Badge variant={statusBadgeVariant(replyingAsset.status)} size="sm" className="capitalize">
                                {replyingAsset.status.replace(/_/g, " ")}
                            </Badge>
                        </div>

                        {replyingAsset.admin_feedback && (
                            <div className="p-3.5 rounded-xl border border-outline-variant/40 bg-surface-container-low space-y-1.5">
                                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                                    <Icons.AlertCircle size={14} />
                                    <span>Administrator Feedback:</span>
                                </div>
                                <p className="text-xs text-on-surface whitespace-pre-wrap leading-relaxed">
                                    {replyingAsset.admin_feedback}
                                </p>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="seller-reply-input"
                                className="block text-xs font-semibold text-on-surface mb-1.5"
                            >
                                Your Response / Revision Notes for Admin
                            </label>
                            <textarea
                                id="seller-reply-input"
                                rows={4}
                                value={sellerReply}
                                onChange={(e) => setSellerReply(e.target.value)}
                                placeholder="Describe the updates you made or reply to the administrator's review comments..."
                                className="w-full rounded-xl border border-outline-variant/40 bg-surface p-3 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-hidden"
                            />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<Icons.Edit size={14} />}
                                onClick={() => {
                                    const id = replyingAsset.id;
                                    setReplyingAsset(null);
                                    void navigate(`/dashboard/seller/products/edit/${id}`);
                                }}
                                className="cursor-pointer"
                            >
                                Edit Asset Files &amp; Details
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setReplyingAsset(null);
                                        setSellerReply("");
                                    }}
                                    className="cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleConfirmResubmit}
                                    isLoading={statusMutation.isPending}
                                    className="cursor-pointer"
                                >
                                    {replyingAsset.status === "pending"
                                        ? "Send Updated Note"
                                        : "Send Response & Resubmit"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Archive Product Confirmation Modal */}
            <Modal
                isOpen={Boolean(assetToDelete)}
                onClose={() => setAssetToDelete(null)}
                title="Archive Product"
            >
                <div className="space-y-4">
                    <p className="text-sm text-on-surface-variant">
                        Are you sure you want to archive <strong className="text-on-surface">&quot;{assetToDelete?.title}&quot;</strong>? This product will be hidden from public search and cannot be purchased until republished.
                    </p>
                    <div className="flex items-center justify-end gap-3 pt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssetToDelete(null)}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={confirmDelete}
                            isLoading={deleteMutation.isPending}
                            className="cursor-pointer"
                        >
                            Archive Asset
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SellerProductsPage;
