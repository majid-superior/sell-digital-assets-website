// src/features/public-catalog/pages/SellerStorefrontPage.tsx
import React from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icons } from "../../../lib/icons/index.ts";
import { Skeleton } from "../../../components/ui/index.ts";
import { assetService } from "../../../services/v1/assetService.ts";
import {
  RESERVED_STOREFRONT_URLS,
  normalizeStorefrontUrl,
} from "../../../utils/slugValidator.ts";
import { resolveMediaUrl } from "../../../utils/media.ts";
import type { DigitalAsset } from "../../../types/asset.ts";
import { AssetCard } from "../components/AssetCard.tsx";

const resolveAssetPriceInDollars = (asset: DigitalAsset): number => {
  if (typeof asset.price === "number") {
    return asset.price / 100;
  }
  if (typeof asset.priceCents === "number") {
    return asset.priceCents / 100;
  }
  if (typeof asset.min_price === "number") {
    return asset.min_price;
  }
  if (asset.tiers && asset.tiers.length > 0) {
    const firstPrice = Number(asset.tiers[0].price);
    if (Number.isFinite(firstPrice)) {
      return firstPrice;
    }
  }
  return 0;
};

const resolveAssetCoverImage = (asset: DigitalAsset): string => {
  return (
    resolveMediaUrl(
      asset.coverImageUrl ||
        asset.preview_url ||
        asset.thumbnail_url ||
        asset.thumbnailUrl ||
        asset.media?.[0]?.url
    ) || ""
  );
};

export const SellerStorefrontPage: React.FC = () => {
  const { sellerUrl } = useParams<{ sellerUrl: string }>();
  const normalizedUrl = normalizeStorefrontUrl(sellerUrl || "");
  const isReservedOrEmpty =
    !normalizedUrl || RESERVED_STOREFRONT_URLS.has(normalizedUrl);

  const {
    data: storefront,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-storefront", normalizedUrl],
    queryFn: () => assetService.getPublicStorefrontByUrl(normalizedUrl),
    enabled: !isReservedOrEmpty,
    retry: false,
  });

  // Prevent system routes from matching as seller URLs
  if (isReservedOrEmpty) {
    return <Navigate replace to="/catalog" />;
  }

  if (isLoading) {
    return (
      <div
        className="max-w-340 mx-auto w-full px-4 lg:px-10 py-10 space-y-12"
        aria-busy="true"
      >
        <div className="rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/40">
          <Skeleton className="aspect-3/1 w-full rounded-none" />
          <div className="p-6 md:p-8 space-y-3">
            <Skeleton className="h-5 w-48 rounded-lg" />
            <Skeleton className="h-9 w-80 max-w-full rounded-lg" />
            <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Guard: Storefront is only visible AFTER seller sets url !== "" and enables isVisible
  if (
    isError ||
    !storefront ||
    !storefront.url ||
    storefront.url.trim() === "" ||
    !storefront.isVisible
  ) {
    return (
      <div className="max-w-340 mx-auto px-4 lg:px-10 py-20 text-center space-y-4">
        <div className="flex justify-center">
          <Icons.Store size={48} className="text-on-surface-variant" />
        </div>
        <h1 className="text-headline-lg text-on-surface">
          Storefront Not Available
        </h1>
        <p className="text-body-md text-on-surface-variant max-w-md mx-auto wrap-break-word">
          The storefront{" "}
          <span className="font-semibold">
            selldigitalassets.com/{normalizedUrl}
          </span>{" "}
          has not been set up or published yet.
        </p>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-container text-on-primary text-label-lg hover:opacity-95 transition-colors duration-150"
        >
          Browse Marketplace Catalog
        </Link>
      </div>
    );
  }

  const featuredAsset = storefront.featuredAsset;
  const featuredCoverUrl = featuredAsset
    ? resolveAssetCoverImage(featuredAsset)
    : "";
  const featuredPrice = featuredAsset
    ? resolveAssetPriceInDollars(featuredAsset)
    : 0;
  const featuredDescription =
    featuredAsset?.description || featuredAsset?.short_description || "";
  const featuredLink = featuredAsset
    ? `/asset/${featuredAsset.slug || featuredAsset.id}`
    : "/catalog";

  return (
    <div className="max-w-340 mx-auto w-full px-4 lg:px-10 py-10 space-y-12">
      {/* 1. Storefront Banner, Title & Description */}
      <section className="rounded-2xl overflow-hidden bg-surface-container-lowest border border-outline-variant/40 shadow-xs">
        <div className="aspect-3/1 w-full bg-surface-container-high relative">
          {storefront.bannerUrl && (
            <img
              src={storefront.bannerUrl}
              alt={storefront.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="p-4 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl min-w-0">
            <div className="inline-flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">
                {storefront.displayName}
              </span>
              <span>•</span>
              <span className="break-all">
                selldigitalassets.com/{storefront.url}
              </span>
            </div>
            <h1 className="text-headline-xl-mobile sm:text-headline-xl text-on-surface wrap-break-word">
              {storefront.title}
            </h1>
            <p className="text-body-md text-on-surface-variant wrap-break-word">
              {storefront.description}
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-outline-variant/30">
            <div>
              <span className="block text-headline-sm text-on-surface">
                {storefront.assets.length}
              </span>
              <span className="text-body-sm text-on-surface-variant">
                Digital Assets
              </span>
            </div>
            <div>
              <span className="block text-headline-sm text-on-surface">
                {(storefront.rating ?? 5.0).toFixed(1)} ★
              </span>
              <span className="text-body-sm text-on-surface-variant">
                {storefront.reviewCount ?? 0} Reviews
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Digital Asset Spotlight (if selected by seller) */}
      {featuredAsset && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Icons.Sparkles size={20} className="text-primary-container shrink-0" />
            <h2 className="text-headline-md text-on-surface">Featured Asset</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 rounded-2xl bg-surface-container-low border border-outline-variant/40 items-center">
            <div className="lg:col-span-7 aspect-16/10 rounded-xl overflow-hidden bg-surface-container-high">
              {featuredCoverUrl ? (
                <img
                  src={featuredCoverUrl}
                  alt={featuredAsset.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  <Icons.Package size={36} className="text-primary" />
                </div>
              )}
            </div>
            <div className="lg:col-span-5 space-y-4 min-w-0">
              <span className="inline-block px-3 py-1 rounded-full bg-primary-container text-on-primary text-badge-caption uppercase">
                Featured Release
              </span>
              <h3 className="text-headline-lg text-on-surface wrap-break-word">
                {featuredAsset.title}
              </h3>
              <p className="text-body-md text-on-surface-variant line-clamp-3 wrap-break-word">
                {featuredDescription}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
                <span className="text-price-hero text-on-surface">
                  ${featuredPrice.toFixed(2)}
                </span>
                <Link
                  to={featuredLink}
                  className="px-5 py-2.5 rounded-lg bg-primary-container text-on-primary text-label-lg hover:opacity-95 transition-colors duration-150"
                >
                  View Asset
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. All Published Seller Assets */}
      <section className="space-y-4">
        <h2 className="text-headline-md text-on-surface">
          All Assets ({storefront.assets.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {storefront.assets.map((asset) => (
            <AssetCard
              key={asset.id}
              id={asset.id}
              slug={asset.slug}
              title={asset.title}
              creator={storefront.displayName}
              imageUrl={resolveAssetCoverImage(asset)}
              price={resolveAssetPriceInDollars(asset)}
              rating={asset.rating ?? asset.ratingAverage ?? 5.0}
              reviewCount={asset.reviewCount ?? asset.reviewsCount ?? 0}
              asset={asset}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default SellerStorefrontPage;

