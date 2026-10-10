// src/features/website/pages/ExplorePage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AssetCard } from "@/components/common/AssetCard.tsx";
import { Icons } from "@/lib/icons/index.ts";
import { Button, EmptyState, Skeleton, Spinner } from "@/components/ui/index.ts";
import { useDebounce } from "@/hooks/useDebounce.ts";
import { useCategories } from "@/hooks/useCategories.ts";
import { assetService } from "@/services/v1/assetService.ts";
import { findCategoryBySlug } from "@/services/v1/categoryService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import type { DigitalAsset } from "@/types/asset.ts";

const ALL_CATEGORIES = "all";

const SORT_OPTIONS = [
    { label: "Most Popular", value: "popular" },
    { label: "Newest First", value: "newest" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
];

export const ExplorePage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParam = searchParams.get("q") || "";
    // Category & sort are read straight from the URL so navbar links always re-filter
    const selectedCategory = searchParams.get("category") || ALL_CATEGORIES;
    const sortBy = searchParams.get("sort") || "popular";

    const [searchQuery, setSearchQuery] = useState(queryParam);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const { categories, isLoading: categoriesLoading } = useCategories();
    const categoryMatch = useMemo(
        () => (selectedCategory === ALL_CATEGORIES ? null : findCategoryBySlug(categories, selectedCategory)),
        [categories, selectedCategory]
    );
    const activeRoot = categoryMatch ? (categoryMatch.ancestors[0] ?? categoryMatch.node) : null;
    const activeSub = categoryMatch ? (categoryMatch.ancestors[1] ?? (categoryMatch.node.depth >= 1 ? categoryMatch.node : null)) : null;

    const updateParam = (key: string, value: string | null) => {
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                if (value) next.set(key, value);
                else next.delete(key);
                return next;
            },
            { replace: true }
        );
    };

    const setSelectedCategory = (slug: string) =>
        updateParam("category", slug === ALL_CATEGORIES ? null : slug);
    const setSortBy = (value: string) => updateParam("sort", value === "popular" ? null : value);

    // Live query via AssetService with Query Key Factory
    const filterParams = useMemo(() => ({
        category: selectedCategory === ALL_CATEGORIES ? undefined : selectedCategory,
        q: debouncedSearchQuery.trim() || undefined,
        sort: sortBy as "popular" | "newest" | "price_asc" | "price_desc",
    }), [selectedCategory, debouncedSearchQuery, sortBy]);

    const { data: apiResponse, isLoading } = useQuery({
        queryKey: queryKeys.assets.list({
            category: selectedCategory,
            q: debouncedSearchQuery,
            sort: sortBy,
        }),
        queryFn: () => assetService.getAssets(filterParams),
        staleTime: 1000 * 60 * 5,
    });

    // Synchronize the debounced keyword into the URL (other params are preserved)
    useEffect(() => {
        const trimmed = debouncedSearchQuery.trim();
        setSearchParams(
            (prev) => {
                if ((prev.get("q") || "") === trimmed) return prev;
                const next = new URLSearchParams(prev);
                if (trimmed) next.set("q", trimmed);
                else next.delete("q");
                return next;
            },
            { replace: true }
        );
    }, [debouncedSearchQuery, setSearchParams]);

    // Live API results with no mock fallback
    const filteredAssets: DigitalAsset[] = useMemo(() => {
        return apiResponse?.items || [];
    }, [apiResponse]);

    const handleResetFilters = () => {
        setSearchQuery("");
        setSearchParams(new URLSearchParams(), { replace: true });
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
            {/* Header Title */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                    {categoryMatch ? categoryMatch.node.name : "Explore Marketplace Assets"}
                </h1>
                <p className="mt-2 text-sm text-on-surface-variant max-w-2xl">
                    {categoryMatch?.node.description ||
                        (categoryMatch
                            ? `Browse digital assets in ${[...categoryMatch.ancestors.map((a) => a.name), categoryMatch.node.name].join(" › ")}.`
                            : "Discover enterprise-grade UI kits, bespoke variable fonts, modular 3D models, and developer templates built by top creators worldwide.")}
                </p>
            </div>

            {/* Filter & Control Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
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

            {/* Category Filter Pills (live active root categories) */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {categoriesLoading ? (
                        Array.from({ length: 6 }, (_, i) => (
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
                {activeRoot && activeRoot.children.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                    Showing <strong className="text-on-surface">{filteredAssets.length}</strong>{" "}
                    {filteredAssets.length === 1 ? "asset" : "assets"}
                </span>

                {(searchQuery || selectedCategory !== ALL_CATEGORIES || sortBy !== "popular") && (
                    <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs">
                        Reset All Filters
                    </Button>
                )}
            </div>

            {/* Assets Grid */}
            {isLoading ? (
                <div className="flex justify-center py-16">
                    <Spinner size="lg" aria-label="Loading marketplace assets" />
                </div>
            ) : filteredAssets.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssets.map((asset) => (
                        <AssetCard key={asset.id} asset={asset} />
                    ))}
                </div>
            ) : (
                <div className="rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-12 text-center">
                    <EmptyState
                        title="No matching assets found"
                        description={searchQuery ? `We couldn't find any assets matching your criteria "${searchQuery}". Try searching for different terms or reset your filters.` : "There are currently no assets listed in this category."}
                        icon={<Icons.Search size={36} />}
                        action={
                            <Button variant="primary" size="md" onClick={handleResetFilters}>
                                View All Assets
                            </Button>
                        }
                    />
                </div>
            )}
        </div>
    );
};

export default ExplorePage;
