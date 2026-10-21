// src/website/CategoryGrid.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";

interface CategoryThumb {
  id: string;
  name: string;
  slug: string;
  count: string;
  imageUrl: string;
}

const CATEGORIES: CategoryThumb[] = [
  {
    id: "tech",
    name: "Technology",
    slug: "technology",
    count: "42.5K+",
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "ai",
    name: "AI & Neural Art",
    slug: "ai",
    count: "28.3K+",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "business",
    name: "Business",
    slug: "business",
    count: "35.1K+",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sports",
    name: "Sports & Fitness",
    slug: "sports",
    count: "19.8K+",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "animals",
    name: "Animals & Wildlife",
    slug: "animals",
    count: "22.4K+",
    imageUrl: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "video-templates",
    name: "Video Templates",
    slug: "video-templates",
    count: "15.9K+",
    imageUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "3d-models",
    name: "3D Models",
    slug: "3d-models",
    count: "18.2K+",
    imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "graphic-templates",
    name: "Graphic Templates",
    slug: "graphic-templates",
    count: "31.7K+",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "architecture",
    name: "Architecture",
    slug: "architecture",
    count: "24.6K+",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "health",
    name: "Health & Wellness",
    slug: "health",
    count: "16.5K+",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "music",
    name: "Music & Audio",
    slug: "music-audio",
    count: "14.1K+",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "ui-kits",
    name: "UI & Web Kits",
    slug: "ui-web-kits",
    count: "27.8K+",
    imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80",
  },
];

export const CategoryGrid: React.FC = () => {
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
        {CATEGORIES.map((category) => (
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-2 right-2">
                <span className="px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono font-semibold">
                  {category.count}
                </span>
              </div>
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

