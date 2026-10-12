// src/features/dashboard/pages/buyer/BuyerDownloadsPage.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { assetService } from "@/services/v1/assetService.ts";
import { downloadService } from "@/services/v1/downloadService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { formatBytes } from "@/utils/file.ts";
import { formatDate } from "@/utils/date.ts";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Badge, Skeleton, EmptyState, Modal, Input, Label } from "@/components/ui/index.ts";
import type { DigitalAsset } from "@/types/asset.ts";

export const BuyerDownloadsPage: React.FC = () => {
    const { user } = useAuth();
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Direct License Download Modal
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [customLicenseKey, setCustomLicenseKey] = useState("");
    const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

    // Fetch downloadable assets from live backend catalog
    const { data: response, isLoading } = useQuery({
        queryKey: queryKeys.assets.list({ limit: 20 }),
        queryFn: () => assetService.getAssets({ limit: 20 }),
    });

    const assets: DigitalAsset[] = response?.items || [];

    const handleExecuteDownload = async (asset: DigitalAsset) => {
        try {
            setDownloadingId(asset.id);
            toast.loading("Generating secure time-limited signed link...", { id: `dl-${asset.id}` });

            const result = await downloadService.generateDownloadLink(asset.id, {
                buyerId: user?.id,
            });

            downloadService.downloadFile(result.downloadUrl, result.fileName);

            toast.success("Download Started", {
                id: `dl-${asset.id}`,
                description: `${result.fileName} (v${result.version || "1.0.0"}) — signed link expires in 15 minutes.`,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to generate download link";
            toast.error("Download Authorization Error", {
                id: `dl-${asset.id}`,
                description: msg.includes("Authorization required")
                    ? "Please enter your license key or confirm purchase ownership."
                    : msg,
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const handleCustomKeyDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customLicenseKey.trim()) {
            toast.error("Please enter a valid license key");
            return;
        }

        try {
            setIsGeneratingCustom(true);
            toast.loading("Verifying key and signing deliverable link...", { id: "custom-dl" });

            // Using first asset or general fulfillment endpoint
            const targetAssetId = assets[0]?.id || "00000000-0000-0000-0000-000000000001";
            const result = await downloadService.generateDownloadLink(targetAssetId, {
                licenseKey: customLicenseKey.trim(),
            });

            downloadService.downloadFile(result.downloadUrl, result.fileName);

            toast.success("Download Stream Ready", {
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
                        Access your production ZIP deliverables, code repositories, and version releases.
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
                        {Array.from({ length: 4 }, (_, i) => (
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
                ) : assets.length > 0 ? (
                    <div className="space-y-3">
                        {assets.map((asset) => {
                            const file = asset.files && asset.files.length > 0 ? asset.files[0] : null;
                            const thumbnail = asset.media?.find((m) => m.media_type === "thumbnail")?.url || asset.thumbnailUrl;
                            const categoryName = typeof asset.category === "object" ? asset.category?.name : (asset.category || "General");
                            const versionStr = file?.version || asset.version || "1.0.0";
                            const fileSize = file?.file_size_bytes || asset.fileSizeInBytes || 0;

                            return (
                                <div
                                    key={asset.id}
                                    className="p-5 rounded-2xl border border-outline-variant/30 bg-surface hover:border-outline-variant/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                                >
                                    {/* Left: Thumbnail & Details */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        {thumbnail ? (
                                            <img
                                                src={thumbnail}
                                                alt={asset.title}
                                                className="w-14 h-14 rounded-2xl object-cover border border-outline-variant/30 bg-surface-container shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-surface-container border border-outline-variant/30 flex items-center justify-center shrink-0 text-primary">
                                                <Icons.Package size={24} />
                                            </div>
                                        )}

                                        <div className="min-w-0 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Link
                                                    to={`/asset/${asset.slug}`}
                                                    className="font-bold text-sm text-on-surface hover:text-primary transition-colors truncate"
                                                >
                                                    {asset.title}
                                                </Link>
                                                <Badge variant="primary" size="sm" className="font-mono text-[9px] uppercase">
                                                    v{versionStr}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-on-surface-variant flex-wrap">
                                                <span>{categoryName}</span>
                                                <span>•</span>
                                                <span className="font-mono">{formatBytes(fileSize)}</span>
                                                <span>•</span>
                                                <span>Updated {formatDate(asset.updated_at || asset.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setCustomLicenseKey("");
                                                setIsKeyModalOpen(true);
                                            }}
                                            className="cursor-pointer text-xs"
                                        >
                                            License Key
                                        </Button>

                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleExecuteDownload(asset)}
                                            isLoading={downloadingId === asset.id}
                                            leftIcon={<Icons.Download size={14} />}
                                            className="cursor-pointer text-xs shadow-xs"
                                        >
                                            Download ZIP
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-12 rounded-3xl border border-dashed border-outline-variant/40 text-center">
                        <EmptyState
                            title="No deliverables found"
                            description="You have not purchased or downloaded any assets yet. Browse our marketplace catalog to find software deliverables."
                            icon={<Icons.Download size={36} />}
                            action={
                                <Link to="/explore">
                                    <Button variant="primary" size="md">
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
                description="Input any valid purchased license key to stream the signed package directly from disk."
            >
                <form onSubmit={handleCustomKeyDownload} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="custom-key-field">License Key (DV26-XXXX-YYYY-ZZZZ-####)</Label>
                        <Input
                            id="custom-key-field"
                            type="text"
                            placeholder="DV26-LIVE-PROD-TEST-8888"
                            value={customLicenseKey}
                            onChange={(e) => setCustomLicenseKey(e.target.value)}
                            className="font-mono uppercase tracking-wider text-sm"
                        />
                        <p className="text-[11px] text-on-surface-variant">
                            Validates cryptographic signature, checks active seats, and produces a 15-minute signed streaming URL.
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

