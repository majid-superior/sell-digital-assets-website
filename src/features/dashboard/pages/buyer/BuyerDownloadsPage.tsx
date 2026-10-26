// src/features/dashboard/pages/buyer/BuyerDownloadsPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { licenseService } from "@/services/v1/licenseService.ts";
import { downloadService } from "@/services/v1/downloadService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { formatBytes } from "@/utils/file.ts";
import { formatDate } from "@/utils/date.ts";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Badge, Skeleton, EmptyState, Modal, Input, Label } from "@/components/ui/index.ts";
import type { BuyerLicenseItem } from "@/types/license.ts";

export const BuyerDownloadsPage: React.FC = () => {
    const [downloadingAssetId, setDownloadingAssetId] = useState<string | null>(null);

    // Direct License Download Modal
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [customLicenseKey, setCustomLicenseKey] = useState("");
    const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

    // Live Query: Fetch authenticated buyer's licensed deliverables from backend
    const { data: licenses = [], isLoading } = useQuery({
        queryKey: queryKeys.licenses.buyer(),
        queryFn: () => licenseService.getBuyerLicenses(),
    });

    /**
     * Authenticated Buyer Download:
     * Calls GET /api/assets/:id/download with Authorization header,
     * handles 403 Forbidden cleanly, and redirects browser to short-lived signed URL.
     */
    const handleDownload = async (assetId: string) => {
        try {
            setDownloadingAssetId(assetId);
            toast.loading("Generating secure download authorization...", { id: `dl-${assetId}` });

            const data = await downloadService.downloadAsset(assetId);

            if (!data?.downloadUrl) {
                throw new Error("No download URL returned from server.");
            }

            toast.success("Download Ready", {
                id: `dl-${assetId}`,
                description: "Signed download link generated. Starting download...",
            });

            window.location.assign(data.downloadUrl);
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : "Failed to download asset";
            const isForbidden =
                (typeof err === "object" && err !== null && "status" in err && (err as { status: number }).status === 403) ||
                errorMsg.includes("403") ||
                errorMsg.toLowerCase().includes("forbidden");

            if (isForbidden) {
                toast.error("Access Forbidden (403)", {
                    id: `dl-${assetId}`,
                    description: "You do not have a verified active purchase for this asset.",
                });
            } else {
                toast.error("Download Error", {
                    id: `dl-${assetId}`,
                    description: errorMsg,
                });
            }
        } finally {
            setDownloadingAssetId(null);
        }
    };

    const handleCustomKeyDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        const key = customLicenseKey.trim();
        if (!key) {
            toast.error("Please enter a valid license key");
            return;
        }

        try {
            setIsGeneratingCustom(true);
            toast.loading("Verifying license key...", { id: "custom-dl" });

            // 1. Live cryptographic verification via backend
            const verification = await licenseService.verifyLicense(key);
            if (!verification.isValid || !verification.asset?.id) {
                toast.error("Invalid License Key", {
                    id: "custom-dl",
                    description: verification.reason || "License key does not exist or has expired.",
                });
                return;
            }

            // 2. Generate signed download link for verified asset
            toast.loading("Signing deliverable package...", { id: "custom-dl" });
            const result = await downloadService.generateDownloadLink(verification.asset.id, {
                licenseKey: key,
            });

            downloadService.downloadFile(result.downloadUrl, result.fileName);

            toast.success("Download Ready", {
                id: "custom-dl",
                description: `Signed package ${result.fileName} is downloading. Link expires in 15 minutes.`,
            });
            setIsKeyModalOpen(false);
            setCustomLicenseKey("");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Download failed";
            toast.error("Download Failed", { id: "custom-dl", description: msg });
        } finally {
            setIsGeneratingCustom(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-outline-variant/30">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                        Purchased Deliverables &amp; Downloads
                    </h1>
                    <p className="text-xs text-on-surface-variant mt-1">
                        Access your production ZIP deliverables, code packages, and version releases.
                    </p>
                </div>

                <Button
                    variant="outline"
                    size="md"
                    onClick={() => setIsKeyModalOpen(true)}
                    leftIcon={<Icons.Download size={16} />}
                    className="cursor-pointer shrink-0"
                >
                    Download with License Key
                </Button>
            </div>

            {/* Downloads List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 3 }, (_, i) => (
                            <div
                                key={i}
                                className="p-5 rounded-2xl border border-outline-variant/30 bg-surface flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <Skeleton variant="rectangular" width={56} height={56} className="rounded-xl shrink-0" />
                                    <div className="space-y-2">
                                        <Skeleton variant="text" width={220} height={18} />
                                        <Skeleton variant="text" width={140} height={14} />
                                    </div>
                                </div>
                                <Skeleton variant="rectangular" width={120} height={36} className="rounded-xl" />
                            </div>
                        ))}
                    </div>
                ) : licenses.length > 0 ? (
                    <div className="space-y-3">
                        {licenses.map((item: BuyerLicenseItem) => {
                            const file = item.files && item.files.length > 0 ? item.files[0] : null;
                            const title = item.asset?.title || "Purchased Digital Asset";
                            const versionStr = file?.version || "1.0.0";
                            const fileSize = file?.file_size_bytes || 0;

                            return (
                                <div
                                    key={item.id}
                                    className="p-3.5 sm:p-5 rounded-2xl border border-outline-variant/30 bg-surface hover:border-outline-variant/60 transition-colors duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                                >
                                    {/* Left: Deliverable Details */}
                                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-center shrink-0 text-primary">
                                            <Icons.Package size={22} className="sm:w-6 sm:h-6" />
                                        </div>

                                        <div className="min-w-0 space-y-1 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {item.asset?.slug ? (
                                                    <Link
                                                        to={`/asset/${item.asset.slug}`}
                                                        className="font-bold text-sm text-on-surface hover:text-primary transition-colors truncate"
                                                    >
                                                        {title}
                                                    </Link>
                                                ) : (
                                                    <span className="font-bold text-sm text-on-surface truncate">
                                                        {title}
                                                    </span>
                                                )}
                                                <Badge variant="primary" size="sm" className="font-mono text-[9px] uppercase">
                                                    v{versionStr}
                                                </Badge>
                                                <Badge variant="outline" size="sm" className="font-mono text-[9px] uppercase">
                                                    {item.tier}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2 sm:gap-3 text-xs text-on-surface-variant flex-wrap min-w-0">
                                                {file?.file_name && (
                                                    <span className="font-mono truncate max-w-40 sm:max-w-xs">{file.file_name}</span>
                                                )}
                                                {fileSize > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="font-mono shrink-0">{formatBytes(fileSize)}</span>
                                                    </>
                                                )}
                                                <span className="hidden sm:inline">•</span>
                                                <span className="shrink-0">Purchased {formatDate(item.issued_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleDownload(item.asset_id)}
                                            isLoading={downloadingAssetId === item.asset_id}
                                            leftIcon={<Icons.Download size={14} />}
                                            className="cursor-pointer text-xs shadow-xs w-full sm:w-auto"
                                        >
                                            Download Asset
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 rounded-3xl border border-dashed border-outline-variant/40 text-center bg-surface">
                        <EmptyState
                            title="No purchased downloads yet"
                            description="You have not purchased any digital deliverables yet. Browse the marketplace catalog to discover software packages, templates, and digital assets."
                            icon={<Icons.Download size={36} />}
                            action={
                                <Link to="/explore">
                                    <Button variant="primary" size="md" className="cursor-pointer">
                                        Explore Marketplace
                                    </Button>
                                </Link>
                            }
                        />
                    </div>
                )}
            </div>

            {/* License Key Fulfillment Modal */}
            <Modal
                isOpen={isKeyModalOpen}
                onClose={() => setIsKeyModalOpen(false)}
                title="Instant Deliverable Download"
                description="Input any valid purchased license key to stream the signed package directly from the live storage system."
            >
                <form onSubmit={handleCustomKeyDownload} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="custom-key-field">License Key (DV26-XXXX-YYYY-ZZZZ-####)</Label>
                        <Input
                            id="custom-key-field"
                            type="text"
                            placeholder="DV26-XXXX-YYYY-ZZZZ-####"
                            value={customLicenseKey}
                            onChange={(e) => setCustomLicenseKey(e.target.value)}
                            className="font-mono uppercase tracking-wider text-sm"
                        />
                        <p className="text-[11px] text-on-surface-variant">
                            Validates cryptographic signature with the live backend, checks active seats, and produces a 15-minute signed streaming URL.
                        </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsKeyModalOpen(false)}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={isGeneratingCustom}
                            leftIcon={<Icons.Download size={14} />}
                            className="cursor-pointer"
                        >
                            Stream Download
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BuyerDownloadsPage;
