import React, { useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/utils/currency.ts";
import { formatBytes } from "@/utils/file.ts";
import { formatDate } from "@/utils/date.ts";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent } from "@/components/ui/index.ts";
import { Spinner } from "@/components/ui/Spinner.tsx";
import { toast } from "sonner";
import { assetService } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import type { LicenseType, DigitalAsset } from "@/types/asset.ts";

export const AssetDetailPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();

    const { data: apiAsset, isLoading } = useQuery<DigitalAsset>({
        queryKey: queryKeys.assets.detail(slug || ""),
        queryFn: () => assetService.getAssetBySlug(slug!),
        enabled: Boolean(slug),
        staleTime: 1000 * 60 * 5,
    });

    const asset = apiAsset;

    const [selectedImage, setSelectedImage] = useState<string>("");
    const [selectedLicense, setSelectedLicense] = useState<LicenseType>("commercial");

    const activeImage = selectedImage || asset?.thumbnailUrl || "";

    if (!asset && !isLoading) {
        return <Navigate to="/explore" replace />;
    }

    if (!asset) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Spinner size="lg" aria-label="Loading digital asset" />
            </div>
        );
    }

    const seller = asset.seller || asset.sellerProfile;

    const baseCents = asset.priceCents;
    const licenseMultipliers: Record<LicenseType, number> = {
        personal: 1,
        commercial: 1.6,
        extended: 3.2,
    };
    const currentPriceCents = Math.round(baseCents * licenseMultipliers[selectedLicense]);

    const allPreviews = [asset.thumbnailUrl, ...(asset.previewUrls || [])];

    const handleBuyNow = () => {
        toast.info("Purchasing Digital Assets", {
            description: "Checkout and automated payments will be enabled soon.",
        });
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <Link to="/explore" className="hover:text-on-surface flex items-center gap-1">
                    <Icons.Explore size={14} /> Marketplace
                </Link>
                <span>/</span>
                <span className="capitalize">{asset.category.replace("_", " ")}</span>
                <span>/</span>
                <span className="font-semibold text-on-surface truncate max-w-xs">{asset.title}</span>
            </div>

            {/* Main Showcase Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left: Gallery & Description (7 Cols) */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Main Image Display */}
                    <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-high aspect-16/10 shadow-lg">
                        <img
                            src={activeImage}
                            alt={asset.title}
                            fetchPriority="high"
                            decoding="async"
                            className="h-full w-full object-cover transition-all duration-300"
                        />
                    </div>

                    {/* Thumbnail Strips */}
                    {allPreviews.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {allPreviews.map((imgUrl, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    aria-label={`Select preview image ${index + 1}`}
                                    aria-pressed={activeImage === imgUrl}
                                    onClick={() => setSelectedImage(imgUrl)}
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
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Asset Description & Features */}
                    <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-6 sm:p-8 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-on-surface">About this Digital Asset</h2>
                            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                                {asset.description}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-on-surface uppercase tracking-wider">
                                Highlights &amp; Inclusions
                            </h3>
                            <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant">
                                <li className="flex items-center gap-2">
                                    <Icons.Check size={16} className="text-primary shrink-0" />
                                    <span>Production-ready source files</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Icons.Check size={16} className="text-primary shrink-0" />
                                    <span>Free lifetime updates and patches</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <Icons.Check size={16} className="text-primary shrink-0" />
                                    <span>Comprehensive documentation</span>
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

                {/* Right: Buy Box & Creator Info (5 Cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Primary Purchase Card */}
                    <Card className="border-outline-variant/40 shadow-xl">
                        <CardHeader className="space-y-3 pb-4">
                            <div className="flex items-center justify-between">
                                <Badge variant="primary" size="sm" className="uppercase font-mono text-[10px]">
                                    {asset.category.replace("_", " ")}
                                </Badge>
                                <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
                                    <Icons.Rating size={14} className="text-amber-500 fill-amber-500" />
                                    <strong className="text-on-surface">{asset.ratingAverage}</strong> ({asset.reviewsCount})
                                </span>
                            </div>

                            <CardTitle className="text-2xl font-bold tracking-tight text-on-surface leading-snug">
                                {asset.title}
                            </CardTitle>

                            <div className="text-3xl font-extrabold text-primary">
                                {formatCurrency(currentPriceCents / 100, asset.currency)}
                                <span className="text-xs font-normal text-on-surface-variant ml-2">One-time purchase</span>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-0">
                            {/* License Tier Selector */}
                            <div className="space-y-2">
                                <span className="text-xs font-semibold text-on-surface-variant block">Select License Tier:</span>
                                <div className="grid grid-cols-3 gap-2">
                                    {(["personal", "commercial", "extended"] as LicenseType[]).map((type) => {
                                        const isSelected = selectedLicense === type;
                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setSelectedLicense(type)}
                                                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer capitalize text-xs font-semibold ${
                                                    isSelected
                                                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                                        : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Purchase CTAs */}
                            <div className="space-y-3">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    className="w-full shadow-lg shadow-primary/20 text-base"
                                    onClick={handleBuyNow}
                                    leftIcon={<Icons.Cart size={18} />}
                                >
                                    Instant Purchase
                                </Button>
                                <Button
                                    variant="outline"
                                    size="md"
                                    className="w-full"
                                    onClick={handleBuyNow}
                                >
                                    Add to Cart
                                </Button>
                            </div>

                            {/* Guarantees */}
                            <div className="space-y-2 pt-2 text-xs text-on-surface-variant">
                                <div className="flex items-center gap-2">
                                    <Icons.Security size={16} className="text-primary" />
                                    <span>256-bit encrypted security</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icons.Success size={16} className="text-primary" />
                                    <span>Instant zip archive download</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Technical Specifications */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold">Technical Specifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0 text-xs">
                            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                                <span className="text-on-surface-variant">Format</span>
                                <span className="font-semibold text-on-surface">{asset.fileFormat}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                                <span className="text-on-surface-variant">File Size</span>
                                <span className="font-semibold text-on-surface">{formatBytes(asset.fileSizeInBytes)}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                                <span className="text-on-surface-variant">Version</span>
                                <span className="font-semibold text-on-surface font-mono">{asset.version}</span>
                            </div>
                            <div className="flex justify-between py-1.5 border-b border-outline-variant/20">
                                <span className="text-on-surface-variant">Total Sales</span>
                                <span className="font-semibold text-on-surface">{asset.salesCount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-on-surface-variant">Published</span>
                                <span className="font-semibold text-on-surface">{formatDate(asset.createdAt)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Creator Store Card */}
                    {seller && (
                        <Card>
                            <CardContent className="p-5 flex items-center gap-4">
                                <img
                                    src={seller.avatarUrl}
                                    alt={seller.storeName}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-14 w-14 rounded-2xl object-cover border border-outline-variant/30"
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="font-bold text-sm text-on-surface truncate">{seller.storeName}</h4>
                                        {seller.verified && (
                                            <Icons.Verified size={15} className="text-primary shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">
                                        {seller.headline}
                                    </p>
                                    <div className="mt-2 flex items-center gap-3 text-[11px] text-on-surface-variant font-medium">
                                        <span>★ {seller.rating} rating</span>
                                        <span>•</span>
                                        <span>{seller.totalSales.toLocaleString()} sales</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AssetDetailPage;
