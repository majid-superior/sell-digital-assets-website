// src/features/website/pages/ExplorePage.tsx
import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AssetCard } from "@/components/common/AssetCard.tsx";
import { Icons } from "@/lib/icons/index.ts";
import { Button, EmptyState, Spinner } from "@/components/ui/index.ts";
import { useDebounce } from "@/hooks/useDebounce.ts";
import { assetService } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import type { AssetCategory, DigitalAsset } from "@/types/asset.ts";

const CATEGORIES: { label: string; value: "all" | AssetCategory }[] = [
    { label: "All Assets", value: "all" },
    { label: "UI Kits", value: "ui_kit" },
    { label: "Fonts & Typography", value: "font" },
    { label: "3D Graphics", value: "3d_model" },
    { label: "Icon Sets", value: "icon_set" },
    { label: "Templates", value: "template" },
];

const SORT_OPTIONS = [
    { label: "Most Popular", value: "popular" },
    { label: "Newest First", value: "newest" },
    { label: "Price: Low to High", value: "price_asc" },
    { label: "Price: High to Low", value: "price_desc" },
];

export const ExplorePage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParam = searchParams.get("q") || "";
    const categoryParam = (searchParams.get("category") as AssetCategory | "all") || "all";
    const sortParam = searchParams.get("sort") || "popular";

    const [searchQuery, setSearchQuery] = useState(queryParam);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [selectedCategory, setSelectedCategory] = useState<"all" | AssetCategory>(categoryParam);
    const [sortBy, setSortBy] = useState(sortParam);

    // Live query via AssetService with Query Key Factory
    const filterParams = useMemo(() => ({
        category: selectedCategory === "all" ? undefined : selectedCategory,
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

    // Synchronize URL parameters when filters change
    useEffect(() => {
        const nextParams = new URLSearchParams();
        if (debouncedSearchQuery.trim()) nextParams.set("q", debouncedSearchQuery.trim());
        if (selectedCategory !== "all") nextParams.set("category", selectedCategory);
        if (sortBy !== "popular") nextParams.set("sort", sortBy);
        setSearchParams(nextParams, { replace: true });
    }, [debouncedSearchQuery, selectedCategory, sortBy, setSearchParams]);

    // Live API results with no mock fallback
    const filteredAssets: DigitalAsset[] = useMemo(() => {
        return apiResponse?.items || [];
    }, [apiResponse]);

    const handleResetFilters = () => {
        setSearchQuery("");
        setSelectedCategory("all");
        setSortBy("popular");
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
            {/* Header Title */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl">
                    Explore Marketplace Assets
                </h1>
                <p className="mt-2 text-sm text-on-surface-variant max-w-2xl">
                    Discover enterprise-grade UI kits, bespoke variable fonts, modular 3D models, and developer templates built by top creators worldwide.
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

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.value;
                    return (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                                isSelected
                                    ? "bg-primary text-on-primary shadow-xs"
                                    : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Active Filters Summary */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span>
                    Showing <strong className="text-on-surface">{filteredAssets.length}</strong>{" "}
                    {filteredAssets.length === 1 ? "asset" : "assets"}
                </span>

                {(searchQuery || selectedCategory !== "all" || sortBy !== "popular") && (
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
