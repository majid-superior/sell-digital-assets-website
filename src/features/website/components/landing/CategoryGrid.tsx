// src/features/website/components/landing/CategoryGrid.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { categoryService, type CategoryThumb } from "@/services/v1/categoryService.ts";

export const CategoryGrid: React.FC = () => {
  // Instant synchronous initialization from local categoryImages.json (0ms delay, zero CLS)
  const [categories] = useState<CategoryThumb[]>(() =>
    categoryService.getLocalCategoryCards(),
  );

  return (
    <section className="space-y-6 sm:space-y-8 py-8 sm:py-12 border-t border-outline-variant/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Icons.Layers size={14} />
            <span>Catalog Taxonomy</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Popular Asset Categories
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
            Browse our catalog across 12 high-demand creative domains.
          </p>
        </div>

        <Link
          to="/categories"
          className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>All 40+ Categories</span>
          <Icons.Next size={14} />
        </Link>
      </div>

      {/* 12 Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4.5">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/explore?category=${encodeURIComponent(category.slug)}`}
            className="group flex flex-col rounded-2xl overflow-hidden bg-surface border border-outline-variant/30 hover:border-primary/60 transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5"
          >
            {/* Thumbnail */}
            <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-container">
              <img
                src={category.imageUrl}
                alt={category.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
            </div>

            {/* Label */}
            <div className="p-3 flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                {category.name}
              </span>
              <Icons.Next
                size={12}
                className="text-on-surface-variant shrink-0 group-hover:translate-x-0.5 group-hover:text-primary transition-transform"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;

