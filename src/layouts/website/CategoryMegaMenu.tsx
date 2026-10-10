// src/layouts/website/CategoryMegaMenu.tsx
import React, { useEffect, useId, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { Skeleton } from "@/components/ui/index.ts";
import { useCategories } from "@/hooks/useCategories.ts";
import { findCategoryBySlug } from "@/services/v1/categoryService.ts";
import type { CategoryNode } from "@/types/category.ts";

/** Max leaf links rendered per subcategory group before collapsing into "+N more". */
const MAX_LEAF_LINKS = 5;

const categoryHref = (slug: string) => `/explore?category=${encodeURIComponent(slug)}`;

/**
 * Resolves the slug of the currently selected category (from `?category=`) and its root ancestor.
 */
function useActiveCategory(categories: CategoryNode[]) {
    const [searchParams] = useSearchParams();
    const activeSlug = searchParams.get("category");
    const match = activeSlug ? findCategoryBySlug(categories, activeSlug) : null;
    const activeRoot = match ? (match.ancestors[0] ?? match.node) : null;
    return { activeSlug, activeRoot };
}

/* -------------------------------------------------------------------------- */
/*                               Desktop Mega Menu                            */
/* -------------------------------------------------------------------------- */

export interface CategoryMegaMenuProps {
    /** Whether the current route should render the trigger in its "active" style. */
    isRouteActive?: boolean;
}

/**
 * Disclosure-style mega menu (button + panel) listing active categories loaded from the backend.
 * Root categories on the left; the hovered/focused root's subcategories and leaves on the right.
 */
export const CategoryMegaMenu: React.FC<CategoryMegaMenuProps> = ({ isRouteActive = false }) => {
    const { categories, isLoading, isError, refetch } = useCategories();
    const { activeSlug, activeRoot } = useActiveCategory(categories);
    const [open, setOpen] = useState(false);
    const [hoveredRootId, setHoveredRootId] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelId = useId();

    const previewRoot =
        categories.find((c) => c.id === hoveredRootId) ?? activeRoot ?? categories[0] ?? null;

    const closeMenu = () => {
        setOpen(false);
        setHoveredRootId(null);
    };

    // Light-dismiss: outside pointer press and Escape key
    useEffect(() => {
        if (!open) return;

        const handlePointerDown = (e: PointerEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setHoveredRootId(null);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                setHoveredRootId(null);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const isActive = isRouteActive || open || Boolean(activeSlug);

    return (
        <div ref={containerRef} className="static">
            <button
                ref={triggerRef}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${isActive
                    ? "bg-surface-container-high text-primary"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    }`}
            >
                <Icons.Categories size={16} />
                <span>Categories</span>
                <Icons.ChevronRight
                    size={14}
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${open ? "-rotate-90" : "rotate-90"}`}
                />
            </button>

            {/* Panel is always mounted (hidden when closed) so aria-controls always resolves */}
            <div
                id={panelId}
                hidden={!open}
                className="absolute inset-x-0 top-full z-50 px-4 sm:px-6 lg:px-8 pt-2"
            >
                <div className="max-w-7xl mx-auto rounded-2xl border border-outline-variant/40 bg-surface shadow-xl overflow-hidden">
                    {isLoading ? (
                        <MegaMenuSkeleton />
                    ) : isError ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                            <Icons.ServerError size={28} className="text-on-surface-variant" />
                            <p className="text-sm text-on-surface-variant">We couldn&apos;t load categories right now.</p>
                            <button
                                type="button"
                                onClick={() => void refetch()}
                                className="px-4 py-1.5 rounded-full text-sm font-medium bg-primary text-on-primary hover:opacity-90 transition-opacity cursor-pointer"
                            >
                                Try again
                            </button>
                        </div>
                    ) : categories.length === 0 ? (
                        <p className="py-12 text-center text-sm text-on-surface-variant">
                            No categories are available yet.
                        </p>
                    ) : (
                        <div className="grid grid-cols-[16rem_1fr] max-h-[min(70vh,34rem)]">
                            {/* Root categories */}
                            <ul className="overflow-y-auto border-r border-outline-variant/30 bg-surface-container-lowest p-2 space-y-0.5">
                                {categories.map((root) => {
                                    const isPreview = previewRoot?.id === root.id;
                                    const isSelected = activeRoot?.id === root.id;
                                    return (
                                        <li key={root.id}>
                                            <Link
                                                to={categoryHref(root.slug)}
                                                onClick={closeMenu}
                                                onMouseEnter={() => setHoveredRootId(root.id)}
                                                onFocus={() => setHoveredRootId(root.id)}
                                                aria-current={isSelected && activeSlug === root.slug ? "page" : undefined}
                                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isPreview
                                                    ? "bg-surface-container-high text-on-surface font-semibold"
                                                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                                                    } ${isSelected ? "text-primary" : ""}`}
                                            >
                                                <span className="truncate">{root.name}</span>
                                                {root.children.length > 0 && (
                                                    <Icons.ChevronRight size={14} aria-hidden="true" className="shrink-0 opacity-60" />
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Subcategory preview for the hovered / selected root */}
                            {previewRoot && (
                                <section
                                    aria-label={`${previewRoot.name} subcategories`}
                                    className="overflow-y-auto p-6"
                                >
                                    <div className="flex items-start justify-between gap-4 mb-5">
                                        <div className="min-w-0">
                                            <h2 className="text-base font-bold text-on-surface truncate">{previewRoot.name}</h2>
                                            {previewRoot.description && (
                                                <p className="mt-1 text-xs text-on-surface-variant line-clamp-2">
                                                    {previewRoot.description}
                                                </p>
                                            )}
                                        </div>
                                        <Link
                                            to={categoryHref(previewRoot.slug)}
                                            onClick={closeMenu}
                                            className="inline-flex items-center gap-1 shrink-0 text-xs font-semibold text-primary hover:underline underline-offset-2"
                                        >
                                            View all
                                            <Icons.Next size={13} aria-hidden="true" />
                                        </Link>
                                    </div>

                                    {previewRoot.children.length === 0 ? (
                                        <p className="text-sm text-on-surface-variant">
                                            Browse every asset in {previewRoot.name}.
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6">
                                            {previewRoot.children.map((sub) => (
                                                <div key={sub.id} className="min-w-0">
                                                    <Link
                                                        to={categoryHref(sub.slug)}
                                                        onClick={closeMenu}
                                                        aria-current={activeSlug === sub.slug ? "page" : undefined}
                                                        className={`block text-sm font-semibold truncate transition-colors ${activeSlug === sub.slug ? "text-primary" : "text-on-surface hover:text-primary"
                                                            }`}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                    {sub.children.length > 0 && (
                                                        <ul className="mt-2 space-y-1.5">
                                                            {sub.children.slice(0, MAX_LEAF_LINKS).map((leaf) => (
                                                                <li key={leaf.id}>
                                                                    <Link
                                                                        to={categoryHref(leaf.slug)}
                                                                        onClick={closeMenu}
                                                                        aria-current={activeSlug === leaf.slug ? "page" : undefined}
                                                                        className={`block text-xs truncate transition-colors ${activeSlug === leaf.slug
                                                                            ? "text-primary font-medium"
                                                                            : "text-on-surface-variant hover:text-on-surface"
                                                                            }`}
                                                                    >
                                                                        {leaf.name}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                            {sub.children.length > MAX_LEAF_LINKS && (
                                                                <li>
                                                                    <Link
                                                                        to={categoryHref(sub.slug)}
                                                                        onClick={closeMenu}
                                                                        className="text-xs font-medium text-primary hover:underline underline-offset-2"
                                                                    >
                                                                        +{sub.children.length - MAX_LEAF_LINKS} more
                                                                    </Link>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-4 border-t border-outline-variant/30 bg-surface-container-lowest px-6 py-3">
                        <span className="text-xs text-on-surface-variant">
                            {categories.length > 0 && `${categories.length} top-level categories`}
                        </span>
                        <Link
                            to="/categories"
                            onClick={closeMenu}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface hover:text-primary transition-colors"
                        >
                            Browse all categories
                            <Icons.Next size={13} aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

/** Skeleton mirroring the two-pane panel geometry to avoid layout shift while loading. */
const MegaMenuSkeleton: React.FC = () => (
    <div className="grid grid-cols-[16rem_1fr]" aria-busy="true" aria-label="Loading categories">
        <div className="border-r border-outline-variant/30 bg-surface-container-lowest p-2 space-y-1">
            {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} variant="rounded" height={36} className="w-full rounded-lg" />
            ))}
        </div>
        <div className="p-6">
            <Skeleton variant="text" width="40%" height={20} />
            <div className="mt-6 grid grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="text" width="55%" height={12} />
                        <Skeleton variant="text" width="60%" height={12} />
                        <Skeleton variant="text" width="45%" height={12} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/* -------------------------------------------------------------------------- */
/*                              Mobile Accordion                              */
/* -------------------------------------------------------------------------- */

export interface MobileCategoryMenuProps {
    /** Called after a category link is followed (e.g. to close the mobile drawer). */
    onNavigate?: () => void;
}

/**
 * Collapsible category list for the mobile navigation drawer.
 */
export const MobileCategoryMenu: React.FC<MobileCategoryMenuProps> = ({ onNavigate }) => {
    const { categories, isLoading, isError, refetch } = useCategories();
    const { activeSlug, activeRoot } = useActiveCategory(categories);
    const [sectionOpen, setSectionOpen] = useState(Boolean(activeSlug));
    const [expandedRootId, setExpandedRootId] = useState<number | null>(activeRoot?.id ?? null);
    const sectionId = useId();

    return (
        <div>
            <button
                type="button"
                aria-expanded={sectionOpen}
                aria-controls={sectionId}
                onClick={() => setSectionOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeSlug
                    ? "bg-surface-container-high text-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    }`}
            >
                <span className="flex items-center gap-2.5">
                    <Icons.Categories size={18} />
                    <span>Categories</span>
                </span>
                <Icons.ChevronRight
                    size={16}
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${sectionOpen ? "-rotate-90" : "rotate-90"}`}
                />
            </button>

            <div id={sectionId} hidden={!sectionOpen} className="mt-1 ml-4 pl-3 border-l border-outline-variant/40 space-y-0.5">
                {isLoading ? (
                    Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} variant="rounded" height={44} className="w-full rounded-lg" />
                    ))
                ) : isError ? (
                    <div className="flex items-center justify-between gap-2 px-3 py-3 text-sm text-on-surface-variant">
                        <span>Couldn&apos;t load categories.</span>
                        <button
                            type="button"
                            onClick={() => void refetch()}
                            className="font-semibold text-primary cursor-pointer"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {categories.map((root) => {
                            const expanded = expandedRootId === root.id;
                            const subListId = `${sectionId}-${root.id}`;
                            return (
                                <div key={root.id}>
                                    <div className="flex items-center">
                                        <Link
                                            to={categoryHref(root.slug)}
                                            onClick={onNavigate}
                                            aria-current={activeSlug === root.slug ? "page" : undefined}
                                            className={`flex-1 min-w-0 truncate px-3 py-3 rounded-lg text-sm transition-colors ${activeRoot?.id === root.id
                                                ? "text-primary font-semibold"
                                                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                                                }`}
                                        >
                                            {root.name}
                                        </Link>
                                        {root.children.length > 0 && (
                                            <button
                                                type="button"
                                                aria-expanded={expanded}
                                                aria-controls={subListId}
                                                aria-label={`${expanded ? "Collapse" : "Expand"} ${root.name}`}
                                                onClick={() => setExpandedRootId(expanded ? null : root.id)}
                                                className="p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
                                            >
                                                <Icons.ChevronRight
                                                    size={16}
                                                    aria-hidden="true"
                                                    className={`transition-transform duration-200 ${expanded ? "-rotate-90" : "rotate-90"}`}
                                                />
                                            </button>
                                        )}
                                    </div>
                                    {root.children.length > 0 && (
                                        <ul id={subListId} hidden={!expanded} className="ml-3 pl-3 border-l border-outline-variant/30">
                                            {root.children.map((sub) => (
                                                <li key={sub.id}>
                                                    <Link
                                                        to={categoryHref(sub.slug)}
                                                        onClick={onNavigate}
                                                        aria-current={activeSlug === sub.slug ? "page" : undefined}
                                                        className={`block truncate px-3 py-2.5 rounded-lg text-sm transition-colors ${activeSlug === sub.slug
                                                            ? "text-primary font-medium"
                                                            : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                                                            }`}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                        <Link
                            to="/categories"
                            onClick={onNavigate}
                            className="flex items-center gap-1 px-3 py-3 text-sm font-semibold text-primary"
                        >
                            Browse all categories
                            <Icons.Next size={14} aria-hidden="true" />
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default CategoryMegaMenu;

