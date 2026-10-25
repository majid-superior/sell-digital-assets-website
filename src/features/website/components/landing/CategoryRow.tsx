// src/features/website/components/landing/CategoryRow.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icons } from "@/lib/icons/index.ts";
import { Skeleton } from "@/components/ui/index.ts";
import { assetService, type CategoryTaxonomyNode } from "@/services/v1/assetService.ts";
import { formatCurrency } from "@/utils/currency.ts";
import { resolveStorageUrl } from "@/utils/media.ts";
import type { DigitalAsset } from "@/types/asset.ts";

export const CategoryRow: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // 1. Fetch live taxonomy and select random category inside queryFn (fresh on every reload)
  const { data: selectedCategory = null, isLoading: isLoadingCategory } = useQuery<CategoryTaxonomyNode | null>({
    queryKey: ["category-taxonomy-spotlight-random"],
    queryFn: async () => {
      const taxonomy = await assetService.getCategoryTaxonomy();
      const list: CategoryTaxonomyNode[] = [];
      const traverse = (nodes: CategoryTaxonomyNode[]) => {
        for (const node of nodes) {
          list.push(node);
          if (node.children && node.children.length > 0) {
            traverse(node.children);
          }
        }
      };
      traverse(taxonomy);
      const pool = list.filter((c) => (c.assetCount ?? 1) > 0);
      const candidates = pool.length > 0 ? pool : list;
      if (candidates.length === 0) return null;
      const randomIndex = Math.floor(Math.random() * candidates.length);
      return candidates[randomIndex] || null;
    },
    staleTime: 0,
  });

  // 2. Fetch best seller assets for the randomly selected category
  const { data: assetsResponse, isLoading: isLoadingAssets } = useQuery({
    queryKey: ["category-best-sellers", selectedCategory?.slug],
    queryFn: () =>
      assetService.getAssets({
        categorySlug: selectedCategory!.slug,
        sort: "popular",
        limit: 12,
      }),
    enabled: Boolean(selectedCategory?.slug),
    staleTime: 1000 * 60 * 5,
  });

  const assets: DigitalAsset[] = useMemo(() => {
    return assetsResponse?.items || [];
  }, [assetsResponse]);

  // 3. Update scroll button states
  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [assets.length, updateScrollButtons]);

  // Horizontal scroll handler
  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  const isLoading = isLoadingCategory || (Boolean(selectedCategory) && isLoadingAssets);

  // Requirement: if no asset found, hide section completely
  if (!isLoading && (!selectedCategory || assets.length === 0)) {
    return null;
  }

  const categoryExploreUrl = selectedCategory
    ? `/explore?category=${encodeURIComponent(selectedCategory.slug)}`
    : "/explore";

  return (
    <section
      className="w-full py-4 sm:py-6"
      aria-label={selectedCategory ? `${selectedCategory.name} Best Sellers` : "Category Best Sellers"}
    >
      {/* Header: Category Name on left, "View all" pill button on right */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          {isLoading && !selectedCategory ? (
            <Skeleton variant="text" width={220} height={28} />
          ) : (
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
              {selectedCategory?.name}
            </h2>
          )}
        </div>

        <div>
          <Link
            to={categoryExploreUrl}
            className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-outline-variant/60 hover:border-on-surface text-xs sm:text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative group/carousel">
        {/* Floating Left Navigation Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label="Previous items"
            className="absolute left-0 sm:-left-3 top-1/2 -translate-y-8 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/80 hover:bg-black text-white dark:bg-surface-container-highest/95 dark:hover:bg-surface-container-high dark:text-on-surface shadow-lg flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
          >
            <Icons.ChevronLeft size={20} />
          </button>
        )}

        {/* Floating Right Navigation Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label="Next items"
            className="absolute right-0 sm:-right-3 top-1/2 -translate-y-8 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/80 hover:bg-black text-white dark:bg-surface-container-highest/95 dark:hover:bg-surface-container-high dark:text-on-surface shadow-lg flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs"
          >
            <Icons.ChevronRight size={20} />
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3 pt-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {isLoading ? (
            /* Zero-CLS Skeleton placeholders matching exact card dimensions */
            Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="shrink-0 w-44 sm:w-56 md:w-60 flex flex-col space-y-2.5"
              >
                <Skeleton variant="rectangular" className="aspect-square w-full rounded-2xl" />
                <Skeleton variant="text" width="85%" height={16} />
                <Skeleton variant="text" width="45%" height={14} />
              </div>
            ))
          ) : (
            assets.map((asset) => {
              const thumbUrl =
                asset.media?.find((m) => m.media_type === "thumbnail")?.url ||
                asset.preview_url ||
                asset.thumbnail_url ||
                "";
              const imageUrl = resolveStorageUrl(thumbUrl);

              const minPrice =
                asset.min_price !== undefined
                  ? Number(asset.min_price)
                  : asset.tiers && asset.tiers.length > 0
                  ? Math.min(...asset.tiers.map((t) => Number(t.price)))
                  : 0;

              const maxPrice =
                asset.tiers && asset.tiers.length > 1
                  ? Math.max(...asset.tiers.map((t) => Number(t.price)))
                  : null;

              const hasDiscount = maxPrice !== null && maxPrice > minPrice;
              const detailUrl = `/asset/${encodeURIComponent(asset.slug)}`;

              return (
                <div
                  key={asset.id}
                  className="snap-start shrink-0 w-44 sm:w-56 md:w-60 group/card flex flex-col"
                >
                  {/* Thumbnail Container */}
                  <Link
                    to={detailUrl}
                    className="relative aspect-square w-full rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/30 block mb-2.5"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={asset.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-surface-container text-on-surface-variant p-3 text-center">
                        <Icons.Package size={28} className="opacity-40 mb-1" />
                        <span className="text-[11px] font-medium truncate max-w-full px-2">
                          {asset.category?.name || "Asset"}
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Title */}
                  <Link to={detailUrl} className="block">
                    <h3 className="text-xs sm:text-sm font-medium text-on-surface line-clamp-1 group-hover/card:text-primary transition-colors">
                      {asset.title}
                    </h3>
                  </Link>

                  {/* Price Row: current price in bold/green, crossed-out original price if applicable */}
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        hasDiscount
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-on-surface"
                      }`}
                    >
                      {formatCurrency(minPrice)}
                    </span>

                    {hasDiscount && (
                      <span className="text-[11px] sm:text-xs text-on-surface-variant line-through font-normal">
                        {formatCurrency(maxPrice)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoryRow;

