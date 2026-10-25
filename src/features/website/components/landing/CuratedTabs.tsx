// src/features/website/components/landing/CuratedTabs.tsx
import React, { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icons } from "@/lib/icons/index.ts";
import { Badge, Button, Skeleton } from "@/components/ui/index.ts";
import { assetService } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { resolveStorageUrl } from "@/utils/media.ts";
import type { DigitalAsset } from "@/types/asset.ts";

export const CuratedTabs: React.FC = () => {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live Query: Retrieve purely backend-curated assets
  const { data: curatedAssets = [], isLoading } = useQuery<DigitalAsset[]>({
    queryKey: queryKeys.assets.curated(),
    queryFn: () => assetService.getCuratedAssets(),
    staleTime: 1000 * 60 * 5,
  });

  // Dynamically extract categories present in the curated assets
  const availableCategories = useMemo(() => {
    const map = new Map<
      string,
      { slug: string; name: string; count: number }
    >();
    for (const asset of curatedAssets) {
      if (asset.category?.slug) {
        const existing = map.get(asset.category.slug);
        if (existing) {
          existing.count += 1;
        } else {
          map.set(asset.category.slug, {
            slug: asset.category.slug,
            name: asset.category.name,
            count: 1,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [curatedAssets]);

  // Tab items: "All Curated" plus each discovered category
  const tabs = useMemo(() => {
    if (availableCategories.length === 0) return [];
    if (availableCategories.length === 1) return availableCategories;
    return [
      { slug: "all", name: "All Curated", count: curatedAssets.length },
      ...availableCategories,
    ];
  }, [availableCategories, curatedAssets.length]);

  // Filter items matching active tab
  const displayAssets = useMemo(() => {
    if (activeCategorySlug === "all") {
      return curatedAssets;
    }
    return curatedAssets.filter((a) => a.category?.slug === activeCategorySlug);
  }, [curatedAssets, activeCategorySlug]);

  const activeTabMeta = useMemo(() => {
    return tabs.find((t) => t.slug === activeCategorySlug) || tabs[0];
  }, [tabs, activeCategorySlug]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = 340;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-6 sm:space-y-8 py-8 sm:py-12 border-t border-outline-variant/20">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Icons.Magic size={14} />
            <span>Curated Collections</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Fresh creative assets by format
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
            {activeTabMeta?.name && activeTabMeta.slug !== "all"
              ? `Hand-picked ${activeTabMeta.name} assets curated for exceptional quality and production readiness.`
              : "Hand-picked, high-production digital assets selected directly by our curation team."}
          </p>
        </div>

        {/* Carousel Prev/Next Buttons */}
        {displayAssets.length > 0 && (
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous curated assets"
              className="p-2 rounded-full border border-outline-variant/40 hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
            >
              <Icons.Back size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next curated assets"
              className="p-2 rounded-full border border-outline-variant/40 hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
            >
              <Icons.Next size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Tabs Navigation */}
      {tabs.length > 1 && (
        <div
          role="tablist"
          aria-label="Curated asset category tabs"
          className="flex flex-wrap items-center gap-2"
        >
          {tabs.map((tab) => {
            const isActive = activeCategorySlug === tab.slug;
            return (
              <button
                key={tab.slug}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategorySlug(tab.slug)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-on-primary shadow-xs"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Content Rendering: Loading / Carousel / Empty */}
      {isLoading ? (
        <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="shrink-0 w-72 sm:w-80 rounded-2xl overflow-hidden bg-surface border border-outline-variant/30 flex flex-col"
            >
              <Skeleton variant="rectangular" className="aspect-16/10 w-full" />
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <Skeleton variant="text" width="30%" height={12} />
                  <Skeleton variant="text" width="85%" height={18} />
                  <Skeleton variant="text" width="50%" height={14} />
                </div>
                <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-center">
                  <Skeleton variant="text" width="35%" height={14} />
                  <Skeleton
                    variant="rectangular"
                    width={28}
                    height={28}
                    className="rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayAssets.length > 0 ? (
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {displayAssets.map((asset) => {
            const thumbUrl =
              asset.media?.find((m) => m.media_type === "thumbnail")?.url ||
              asset.preview_url ||
              asset.thumbnail_url ||
              "";
            const imageUrl = resolveStorageUrl(thumbUrl);

            const minPrice =
              asset.min_price !== undefined
                ? Number(asset.min_price)
                : asset.tiers?.length
                  ? Math.min(...asset.tiers.map((t) => Number(t.price)))
                  : 0;

            const formatLabel = asset.category?.name || "Digital Asset";
            const sellerName =
              asset.seller?.name ||
              asset.sellerProfile?.storeName ||
              "Verified Creator";

            const exploreLink = asset.category?.slug
              ? `/explore?category=${encodeURIComponent(asset.category.slug)}`
              : `/explore`;

            const detailLink = `/asset/${encodeURIComponent(asset.slug)}`;

            return (
              <div
                key={asset.id}
                className="snap-start shrink-0 w-72 sm:w-80 group rounded-2xl overflow-hidden bg-surface border border-outline-variant/30 hover:border-primary/50 transition-all shadow-xs hover:shadow-md flex flex-col"
              >
                {/* Thumbnail Image Container */}
                <Link
                  to={detailLink}
                  className="relative aspect-16/10 w-full overflow-hidden bg-surface-container block"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={asset.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container text-on-surface-variant p-4 text-center">
                      <Icons.Package size={32} className="opacity-40 mb-1" />
                      <span className="text-xs font-medium">{formatLabel}</span>
                    </div>
                  )}

                  {/* Curated Badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      size="sm"
                      className="backdrop-blur-md bg-black/60 text-white border-none text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Icons.Magic size={10} className="text-primary" />
                      <span>Curated</span>
                    </Badge>
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-md text-on-surface text-xs font-bold shadow-xs">
                      ${minPrice}
                    </span>
                  </div>
                </Link>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-medium text-primary uppercase tracking-wide">
                      {formatLabel}
                    </span>
                    <Link to={detailLink} className="block">
                      <h3 className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {asset.title}
                      </h3>
                    </Link>
                    <span className="text-xs text-on-surface-variant block mt-0.5">
                      by {sellerName}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                    <Link
                      to={exploreLink}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Explore Similar</span>
                      <Icons.Next size={13} />
                    </Link>

                    <Link
                      to={detailLink}
                      className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface transition-colors cursor-pointer"
                      aria-label={`View details for ${asset.title}`}
                    >
                      <Icons.Explore size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State when no assets are currently curated */
        <div className="text-center py-12 px-4 rounded-2xl border border-outline-variant/30 bg-surface-container-low space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Icons.Magic size={24} />
          </div>
          <h3 className="text-base font-bold text-on-surface">
            Curated Collections Coming Soon
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Our editorial curators are selecting showcase digital products.
          </p>
          <div className="pt-2">
            <Link to="/explore">
              <Button
                variant="outline"
                size="sm"
                rightIcon={<Icons.Next size={14} />}
                className="cursor-pointer"
              >
                Explore Marketplace Catalog
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Bottom link to view full collection */}
      {displayAssets.length > 0 && (
        <div className="flex justify-center pt-2">
          <Link
            to={
              activeCategorySlug !== "all"
                ? `/explore?category=${encodeURIComponent(activeCategorySlug)}`
                : `/explore`
            }
          >
            <Button
              variant="outline"
              size="md"
              rightIcon={<Icons.Next size={15} />}
              className="cursor-pointer"
            >
              View all{" "}
              {activeTabMeta?.name && activeTabMeta.slug !== "all"
                ? activeTabMeta.name
                : "Curated"}{" "}
              assets
            </Button>
          </Link>
        </div>
      )}
    </section>
  );
};

export default CuratedTabs;
