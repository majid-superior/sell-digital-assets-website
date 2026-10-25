// src/features/website/pages/ExplorePage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AssetCard } from "@/components/common/AssetCard.tsx";
import { Icons } from "@/lib/icons/index.ts";
import { Button, EmptyState, Skeleton } from "@/components/ui/index.ts";
import { useDebounce } from "@/hooks/useDebounce.ts";
import { useCategories } from "@/hooks/useCategories.ts";
import { assetService } from "@/services/v1/assetService.ts";
import { findCategoryBySlug } from "@/services/v1/categoryService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import type { DigitalAsset } from "@/types/asset.ts";

const ALL_CATEGORIES = "all";

const SORT_OPTIONS = [
    { label: "Newest First", value: "newest" },
    { label: "Most Popular", value: "popular" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
];

export const ExplorePage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParam = searchParams.get("q") || "";
    const selectedCategory = searchParams.get("category") || ALL_CATEGORIES;
    const sortBy = searchParams.get("sort") || "newest";
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const priceMinParam = searchParams.get("priceMin") || "";
    const priceMaxParam = searchParams.get("priceMax") || "";

    const [searchQuery, setSearchQuery] = useState(queryParam);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const [priceMin, setPriceMin] = useState(priceMinParam);
    const [priceMax, setPriceMax] = useState(priceMaxParam);
    const debouncedPriceMin = useDebounce(priceMin, 400);
    const debouncedPriceMax = useDebounce(priceMax, 400);

    const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
    const limit = 12;

    const { categories, isLoading: categoriesLoading } = useCategories();
    const categoryMatch = useMemo(
        () => (selectedCategory === ALL_CATEGORIES ? null : findCategoryBySlug(categories, selectedCategory)),
        [categories, selectedCategory]
    );
    const isCategoryInactive = Boolean(selectedCategory !== ALL_CATEGORIES && !categoryMatch && !categoriesLoading);
    const activeRoot = categoryMatch ? (categoryMatch.ancestors[0] ?? categoryMatch.node) : null;
    const activeSub = categoryMatch ? (categoryMatch.ancestors[1] ?? (categoryMatch.node.depth >= 1 ? categoryMatch.node : null)) : null;

    const updateParam = React.useCallback((updates: Record<string, string | null>) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                for (const [key, value] of Object.entries(updates)) {
                    if (value !== null && value !== "") {
                        next.set(key, value);
                    } else {
                        next.delete(key);
                    }
                }
                return next;
            },
            { replace: true }
        );
    }, [setSearchParams]);

    const setSelectedCategory = (slug: string) => {
        updateParam({ category: slug === ALL_CATEGORIES ? null : slug, page: "1" });
    };

    const setSortBy = (value: string) => {
        updateParam({ sort: value === "newest" ? null : value, page: "1" });
    };

    const handlePageChange = (newPage: number) => {
        updateParam({ page: newPage === 1 ? null : String(newPage) });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Synchronize debounced filters to URL
    useEffect(() => {
        const trimmed = debouncedSearchQuery.trim();
        updateParam({
            q: trimmed || null,
            priceMin: debouncedPriceMin ? debouncedPriceMin : null,
            priceMax: debouncedPriceMax ? debouncedPriceMax : null,
        });
    }, [debouncedSearchQuery, debouncedPriceMin, debouncedPriceMax, updateParam]);

    // Live query via AssetService
    const filterParams = useMemo(() => ({
        categorySlug: selectedCategory === ALL_CATEGORIES ? undefined : selectedCategory,
        q: debouncedSearchQuery.trim() || undefined,
        priceMin: debouncedPriceMin ? Number(debouncedPriceMin) : undefined,
        priceMax: debouncedPriceMax ? Number(debouncedPriceMax) : undefined,
        sort: sortBy as "popular" | "newest" | "price_asc" | "price_desc",
        page: currentPage,
        limit,
    }), [selectedCategory, debouncedSearchQuery, debouncedPriceMin, debouncedPriceMax, sortBy, currentPage]);

    const { data: apiResponse, isLoading, isFetching } = useQuery({
        queryKey: queryKeys.assets.list({
            category: selectedCategory,
            q: debouncedSearchQuery,
            priceMin: debouncedPriceMin,
            priceMax: debouncedPriceMax,
            sort: sortBy,
            page: currentPage,
            limit,
        }),
        queryFn: () => assetService.getAssets(filterParams),
        staleTime: 1000 * 60 * 3,
    });

    const assets: DigitalAsset[] = useMemo(() => {
        return apiResponse?.items || [];
    }, [apiResponse]);

    const totalCount = apiResponse?.total ?? assets.length;
    const totalPages = Math.max(1, apiResponse?.totalPages ?? Math.ceil(totalCount / limit));

    const handleResetFilters = () => {
        setSearchQuery("");
        setPriceMin("");
        setPriceMax("");
        setSearchParams(new URLSearchParams(), { replace: true });
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
            {/* Header Title */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                    {categoryMatch
                        ? categoryMatch.node.name
                        : isCategoryInactive
                        ? "Category Not Found"
                        : "Explore Marketplace Assets"}
                </h1>
                <p className="mt-2 text-sm text-on-surface-variant max-w-2xl">
                    {categoryMatch?.node.description ||
                        (categoryMatch
                            ? `Browse digital assets in ${[...categoryMatch.ancestors.map((a) => a.name), categoryMatch.node.name].join(" › ")}.`
                            : isCategoryInactive
                            ? "The selected category is currently inactive or does not exist. Browse other categories or view all assets below."
                            : "Discover enterprise-grade UI kits, bespoke variable fonts, modular 3D models, and developer templates built by top creators worldwide.")}
                </p>
            </div>

            {/* Filter & Control Bar */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
                        <Icons.Search size={16} />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter by keyword, tech, or format..."
                        className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-surface border border-outline-variant/40 text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-on-surface cursor-pointer"
                        >
                            <Icons.Close size={14} />
                        </button>
                    )}
                </div>

                {/* Price Range Filter Inputs */}
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-on-surface-variant shrink-0">Price ($):</span>
                    <input
                        type="number"
                        min="0"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        placeholder="Min"
                        className="w-16 px-2 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant/40 text-on-surface focus:outline-hidden focus:border-primary text-center"
                    />
                    <span className="text-xs text-on-surface-variant">-</span>
                    <input
                        type="number"
                        min="0"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        placeholder="Max"
                        className="w-16 px-2 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant/40 text-on-surface focus:outline-hidden focus:border-primary text-center"
                    />
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                    <label htmlFor="sort-select" className="text-xs font-semibold text-on-surface-variant shrink-0">
                        Sort By:
                    </label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 text-xs font-semibold rounded-xl bg-surface border border-outline-variant/40 text-on-surface focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Category Filter Pills */}
            <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    {categoriesLoading ? (
                        Array.from({ length: 8 }, (_, i) => (
                            <Skeleton key={i} variant="circular" width={i === 0 ? 88 : 120} height={32} />
                        ))
                    ) : (
                        [{ id: 0, name: "All Assets", slug: ALL_CATEGORIES }, ...categories].map((cat) => {
                            const isSelected =
                                cat.slug === ALL_CATEGORIES
                                    ? selectedCategory === ALL_CATEGORIES
                                    : activeRoot?.id === cat.id;
                            return (
                                <button
                                    key={cat.slug}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => setSelectedCategory(cat.slug)}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                                        isSelected
                                            ? "bg-primary text-on-primary shadow-xs"
                                            : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Subcategory pills for the selected root */}
                {activeRoot && activeRoot.children && activeRoot.children.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {activeRoot.children.map((sub) => {
                            const isSelected = activeSub?.id === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => setSelectedCategory(isSelected ? activeRoot.slug : sub.slug)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all cursor-pointer ${
                                        isSelected
                                            ? "border-primary text-primary bg-primary/10"
                                            : "border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:border-outline-variant"
                                    }`}
                                >
                                    {sub.name}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Active Filters Summary */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>
                    Showing <strong className="text-on-surface">{assets.length}</strong> of{" "}
                    <strong className="text-on-surface">{totalCount}</strong> assets (Page {currentPage} of {totalPages})
                </span>

                {(searchQuery || selectedCategory !== ALL_CATEGORIES || sortBy !== "newest" || priceMin || priceMax) && (
                    <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs cursor-pointer">
                        Reset All Filters
                    </Button>
                )}
            </div>

            {/* Assets Grid with Zero Layout Shift (CLS = 0) */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="rounded-2xl border border-outline-variant/30 overflow-hidden bg-surface flex flex-col">
                            <Skeleton variant="rectangular" className="aspect-16/10 w-full" />
                            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                    <Skeleton variant="text" width="40%" height={14} />
                                    <Skeleton variant="text" width="80%" height={20} />
                                    <Skeleton variant="text" width="100%" height={14} />
                                </div>
                                <div className="pt-3 border-t border-outline-variant/20 flex justify-between items-center">
                                    <Skeleton variant="text" width="25%" height={16} />
                                    <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : assets.length > 0 ? (
                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${isFetching ? "opacity-75 transition-opacity" : ""}`}>
                    {assets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} />
                    ))}
                </div>
            ) : (
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center">
                    <EmptyState
                        title={isCategoryInactive ? "Category not found" : "No matching assets found"}
                        description={
                            searchQuery
                                ? `We couldn't find any assets matching your criteria "${searchQuery}". Try searching for different terms or reset your filters.`
                                : isCategoryInactive
                                ? "This category is currently inactive or does not exist."
                                : "There are currently no assets listed matching your selected criteria."
                        }
                        icon={<Icons.Search size={36} />}
                        action={
                            <Button variant="primary" size="md" onClick={handleResetFilters} className="cursor-pointer">
                                View All Assets
                            </Button>
                        }
                    />
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6 border-t border-outline-variant/20">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        leftIcon={<Icons.Back size={14} />}
                        className="cursor-pointer"
                    >
                        Previous
                    </Button>
                    <div className="flex items-center gap-1 px-3 text-xs font-semibold text-on-surface">
                        <span>Page {currentPage} of {totalPages}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                        rightIcon={<Icons.Next size={14} />}
                        className="cursor-pointer"
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ExplorePage;
