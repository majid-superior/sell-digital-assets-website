// src/features/website/pages/AssetDetailPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/hooks/useOrganization.ts";
import { formatCurrency } from "@/utils/currency.ts";
import { formatBytes } from "@/utils/file.ts";
import { formatDate } from "@/utils/date.ts";
import { resolveMediaUrl } from "@/utils/media.ts";
import { Icons } from "@/lib/icons/index.ts";
import {
    Button,
    Badge,
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Modal,
    Input,
    Label,
} from "@/components/ui/index.ts";
import { Spinner } from "@/components/ui/Spinner.tsx";
import { toast } from "sonner";
import { assetService } from "@/services/v1/assetService.ts";
import { downloadService } from "@/services/v1/downloadService.ts";
import { licenseService } from "@/services/v1/licenseService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import type { TierType, DigitalAsset, AssetTier } from "@/types/asset.ts";

export const AssetDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { user } = useAuth();
    const { organization } = useOrganization();

    const { data: asset, isLoading } = useQuery<DigitalAsset>({
        queryKey: queryKeys.assets.detail(slug || ""),
        queryFn: () => assetService.getAssetBySlug(slug!),
        enabled: Boolean(slug),
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (asset?.title) {
            const orgTitle = organization?.title || organization?.shortName || "AssetDrop";
            document.title = `${asset.title} | ${orgTitle} | Marketplace`;
        }
    }, [asset?.title, organization?.title, organization?.shortName]);

    // Media showcase state
    const [selectedImage, setSelectedImage] = useState<string>("");
    const [mainImageError, setMainImageError] = useState<boolean>(false);

    // Dynamic Tier selection state
    const [selectedTierOverride, setSelectedTierOverride] = useState<TierType | null>(null);
    const selectedTierType: TierType = selectedTierOverride ?? (asset?.tiers?.[0]?.tier_type || "personal");

    // Deliverable Download Modal state
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [downloadLicenseKey, setDownloadLicenseKey] = useState("");
    const [isDownloading, setIsDownloading] = useState(false);
    const [isIssuingLicense, setIsIssuingLicense] = useState(false);

    if (!asset && !isLoading) {
        return <Navigate to="/explore" replace />;
    }

    if (!asset) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Spinner size="lg" aria-label="Loading digital asset details" />
            </div>
        );
    }

    // Media previews
    const allMediaUrls: string[] = [];
    if (asset.media && asset.media.length > 0) {
        for (const m of asset.media) {
            if (m.url) {
                const resolved = resolveMediaUrl(m.url);
                if (resolved && !allMediaUrls.includes(resolved)) allMediaUrls.push(resolved);
            }
        }
    }
    if (allMediaUrls.length === 0 && asset.thumbnailUrl) {
        const resolvedThumb = resolveMediaUrl(asset.thumbnailUrl);
        if (resolvedThumb) allMediaUrls.push(resolvedThumb);
    }
    if (asset.previewUrls && asset.previewUrls.length > 0) {
        for (const url of asset.previewUrls) {
            const resolved = resolveMediaUrl(url);
            if (resolved && !allMediaUrls.includes(resolved)) allMediaUrls.push(resolved);
        }
    }

    const activeImage = selectedImage ? resolveMediaUrl(selectedImage) : (allMediaUrls[0] || "");

    // Tiers mapping
    const tiersList: AssetTier[] = asset.tiers && asset.tiers.length > 0
        ? asset.tiers
        : [
            { id: "1", tier_type: "personal", price: asset.min_price || 29, license_terms_summary: "Single personal project" },
            { id: "2", tier_type: "commercial", price: (asset.min_price || 29) * 2, license_terms_summary: "Up to 5 commercial projects" },
            { id: "3", tier_type: "extended", price: (asset.min_price || 29) * 5, license_terms_summary: "Unlimited projects & resale rights" },
        ];

    const currentTier = tiersList.find((t) => t.tier_type === selectedTierType) || tiersList[0];
    const currentPrice = currentTier ? currentTier.price : (asset.min_price || 0);

    // Active Deliverable File
    const deliverableFile = asset.files && asset.files.length > 0 ? asset.files[0] : null;

    // Category name
    const categoryName = asset.category?.name || "Marketplace Asset";

    // Creator details
    const seller = asset.seller || asset.sellerProfile;
    const sellerName = seller && "storeName" in seller && seller.storeName
        ? seller.storeName
        : seller && "name" in seller && seller.name
        ? seller.name
        : "Verified Creator";

    const handleCheckoutOrTestLicense = async () => {
        if (!user?.id) {
            toast.info("Authentication Required", {
                description: "Please sign in to complete your asset purchase or generate a test license.",
            });
            return;
        }

        try {
            setIsIssuingLicense(true);
            const issued = await licenseService.issueTestLicense(asset.id, user.id, selectedTierType);
            toast.success("Order Processed Successfully!", {
                description: `License Issued: ${issued.license_key}. You can now download the deliverable.`,
            });
            setDownloadLicenseKey(issued.license_key);
            setIsDownloadModalOpen(true);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to issue license";
            toast.error("Checkout Failed", { description: errorMsg });
        } finally {
            setIsIssuingLicense(false);
        }
    };

    const handleExecuteDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsDownloading(true);
            const result = await downloadService.generateDownloadLink(asset.id, {
                licenseKey: downloadLicenseKey.trim() || undefined,
                buyerId: user?.id || undefined,
            });

            downloadService.downloadFile(result.downloadUrl, result.fileName);

            toast.success("Download Initialized", {
                description: `Your secure signed download link for ${result.fileName} is active for 15 minutes.`,
            });
            setIsDownloadModalOpen(false);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Unable to generate download link";
            toast.error("Download Failed", {
                description: errorMsg.includes("403") || errorMsg.includes("Authorization")
                    ? "Valid license key or authenticated purchaser account required."
                    : errorMsg,
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Link to="/explore" className="hover:text-on-surface flex items-center gap-1 transition-colors">
                    <Icons.Explore size={14} /> Marketplace
                </Link>
                <span>/</span>
                <span className="capitalize">{categoryName}</span>
                <span>/</span>
                <span className="font-semibold text-on-surface truncate max-w-xs">{asset.title}</span>
            </nav>

            {/* Main Showcase Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left: Gallery & Description (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Main Image Display */}
                    <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-high aspect-16/10 shadow-lg relative flex items-center justify-center">
                        {activeImage && !mainImageError ? (
                            <img
                                src={activeImage}
                                alt={asset.title}
                                fetchPriority="high"
                                decoding="async"
                                onError={() => setMainImageError(true)}
                                className="h-full w-full object-cover transition-all duration-300"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center text-on-surface-variant p-6 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-surface/70 flex items-center justify-center mb-3">
                                    <Icons.Package size={32} className="text-primary" />
                                </div>
                                <h3 className="font-bold text-base text-on-surface">{asset.title}</h3>
                                <p className="text-xs text-on-surface-variant mt-1">No media preview uploaded yet</p>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail Gallery Strips */}
                    {allMediaUrls.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                            {allMediaUrls.map((imgUrl, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    aria-label={`Select preview image ${index + 1}`}
                                    aria-pressed={activeImage === imgUrl}
                                    onClick={() => {
                                        setSelectedImage(imgUrl);
                                        setMainImageError(false);
                                    }}
                                    className={`relative h-20 w-28 overflow-hidden rounded-xl border-2 transition-all cursor-pointer shrink-0 ${
                                        activeImage === imgUrl
                                            ? "border-primary ring-2 ring-primary/20 scale-102"
                                            : "border-transparent opacity-70 hover:opacity-100"
                                    }`}
                                >
                                    <img
                                        src={imgUrl}
                                        alt={`Preview ${index + 1}`}
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                            (e.currentTarget as HTMLElement).style.opacity = "0.3";
                                        }}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Asset Description & Inclusions */}
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 sm:p-8 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-on-surface">About this Digital Asset</h2>
                            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant whitespace-pre-line">
                                {asset.full_description || asset.short_description || asset.description}
                            </p>
                        </div>

                        {/* Inclusions */}
                        <div>
                            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">
                                Highlights &amp; Inclusions
                            </h3>
                            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant">
                                <li className="flex items-center gap-2">
                                    <Icons.Check size={16} className="text-primary shrink-0" />
                                    <span>Production-ready source deliverable</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Icons.Check size={16} className="text-primary shrink-0" />
                                    <span>Cryptographic license key authentication</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Icons.Check size={16} className="text-primary shrink-0" />
                                    <span>High-speed signed direct storage streaming</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Icons.Check size={16} className="text-primary shrink-0" />
                                    <span>Commercial monetization enabled</span>
                                </li>
                            </ul>
                        </div>

                        {/* Tags */}
                        {asset.tags && asset.tags.length > 0 && (
                            <div className="pt-4 border-t border-outline-variant/30">
                                <h4 className="text-xs font-semibold text-on-surface-variant mb-2">Related Tags:</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {asset.tags.map((tag) => (
                                        <Badge key={tag} variant="outline" size="sm" className="font-mono text-[11px]">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Buy Box, Tiers, Specs & Deliverables (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Primary Purchase Card */}
                    <Card className="border-outline-variant/40 shadow-xl">
                        <CardHeader className="space-y-3 pb-4">
                            <div className="flex items-center justify-between">
                                <Badge variant="primary" size="sm" className="uppercase font-mono text-[10px]">
                                    {categoryName}
                                </Badge>
                                <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                                    <Icons.Rating size={14} className="text-amber-500 fill-amber-500" />
                                    <strong className="text-on-surface">{asset.view_count}</strong> views •{" "}
                                    <strong className="text-on-surface">{asset.download_count}</strong> downloads
                                </span>
                            </div>

                            <CardTitle className="text-2xl font-bold tracking-tight text-on-surface leading-snug">
                                {asset.title}
                            </CardTitle>

                            <div className="text-3xl font-extrabold text-primary">
                                {formatCurrency(currentPrice)}
                                <span className="text-xs font-normal text-on-surface-variant ml-2 capitalize">
                                    {selectedTierType} License
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-0">
                            {/* Dynamic Tier Selector */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-on-surface-variant block">Select License Tier:</span>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {tiersList.map((tier) => {
                                        const isSelected = selectedTierType === tier.tier_type;
                                        return (
                                            <button
                                                key={tier.id || tier.tier_type}
                                                type="button"
                                                onClick={() => setSelectedTierOverride(tier.tier_type)}
                                                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                                                    isSelected
                                                        ? "border-primary bg-primary/10 ring-1 ring-primary shadow-xs"
                                                        : "border-outline-variant/30 hover:bg-surface-container"
                                                }`}
                                            >
                                                <div>
                                                    <span className="text-xs font-bold capitalize text-on-surface block">
                                                        {tier.tier_type} License
                                                    </span>
                                                    {tier.license_terms_summary && (
                                                        <span className="text-[11px] text-on-surface-variant block mt-0.5">
                                                            {tier.license_terms_summary}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm font-extrabold text-primary">
                                                    {formatCurrency(tier.price)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Purchase & Fulfillment CTAs */}
                            <div className="space-y-3 pt-2">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full shadow-lg shadow-primary/20 text-base cursor-pointer"
                                    onClick={handleCheckoutOrTestLicense}
                                    isLoading={isIssuingLicense}
                                    leftIcon={<Icons.Cart size={18} />}
                                >
                                    Buy Now ({formatCurrency(currentPrice)})
                                </Button>
                                <Button
                                    variant="outline"
                                    size="md"
                                    className="w-full cursor-pointer"
                                    onClick={() => setIsDownloadModalOpen(true)}
                                    leftIcon={<Icons.Download size={16} />}
                                >
                                    Download Deliverable
                                </Button>
                            </div>

                            {/* Guarantees */}
                            <div className="space-y-2 pt-2 text-xs text-on-surface-variant">
                                <div className="flex items-center gap-2">
                                    <Icons.Security size={16} className="text-primary" />
                                    <span>256-bit signed cryptographic tokens</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icons.Success size={16} className="text-primary" />
                                    <span>Instant ZIP archive fulfillment</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Deliverables Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                <Icons.Package size={16} className="text-primary" />
                                Deliverable Package
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                                <span className="text-on-surface-variant">File Name</span>
                                <span className="font-semibold text-on-surface font-mono truncate max-w-[200px]">
                                    {deliverableFile?.file_name || "ZIP Archive"}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                                <span className="text-on-surface-variant">Version</span>
                                <span className="font-semibold text-on-surface font-mono">
                                    v{deliverableFile?.version || "1.0.0"}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                                <span className="text-on-surface-variant">File Size</span>
                                <span className="font-semibold text-on-surface">
                                    {formatBytes(deliverableFile?.file_size_bytes || 0)}
                                </span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-on-surface-variant">Uploaded</span>
                                <span className="font-semibold text-on-surface">
                                    {formatDate(deliverableFile?.created_at || asset.created_at)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Specifications */}
                    {asset.technical_specs && Object.keys(asset.technical_specs).length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold">Technical Specifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2.5 pt-0 text-xs">
                                {Object.entries(asset.technical_specs).map(([specKey, specVal]) => (
                                    <div key={specKey} className="flex justify-between py-1.5 border-b border-outline-variant/20 last:border-b-0">
                                        <span className="text-on-surface-variant">{specKey}</span>
                                        <span className="font-semibold text-on-surface">
                                            {typeof specVal === "string" || typeof specVal === "number" || typeof specVal === "boolean"
                                                ? String(specVal)
                                                : JSON.stringify(specVal)}
                                        </span>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Creator Store Card */}
                    <Card>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary font-bold flex items-center justify-center text-base border border-outline-variant/30">
                                {sellerName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-sm text-on-surface truncate">{sellerName}</h4>
                                    <Icons.Verified size={15} className="text-primary shrink-0" />
                                </div>
                                <p className="text-xs text-on-surface-variant truncate mt-0.5">
                                    {seller && "email" in seller ? seller.email : "Official Publisher"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Download Deliverable Modal */}
            <Modal
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
                title="Download Asset Deliverable"
                description="Enter your active license key or download using your authenticated buyer account."
            >
                <form onSubmit={handleExecuteDownload} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="license-key-input">License Key</Label>
                        <Input
                            id="license-key-input"
                            type="text"
                            placeholder="e.g. DV26-XXXX-YYYY-ZZZZ-####"
                            value={downloadLicenseKey}
                            onChange={(e) => setDownloadLicenseKey(e.target.value)}
                            className="font-mono uppercase tracking-wider"
                        />
                        <p className="text-[11px] text-on-surface-variant">
                            License keys are issued upon checkout or available in your Buyer Dashboard.
                        </p>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsDownloadModalOpen(false)}
                            className="cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            isLoading={isDownloading}
                            leftIcon={<Icons.Download size={14} />}
                            className="cursor-pointer"
                        >
                            Generate Download
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default AssetDetailPage;
