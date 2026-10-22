// src/features/website/components/landing/KeywordGrid.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";

interface KeywordTheme {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  keywords: string[];
}

const THEMES: KeywordTheme[] = [
  {
    id: "backgrounds",
    title: "Backgrounds",
    description: "Atmospheric 3D gradients, studio backdrops, abstract meshes, and minimalist textures.",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    keywords: ["Abstract", "3D Gradients", "Minimalist", "Studio", "Textures"],
  },
  {
    id: "food-drink",
    title: "Food and drink",
    description: "Artisan culinary dishes, gourmet recipes, espresso culture, and craft cocktails.",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    keywords: ["Gourmet", "Artisan Coffee", "Culinary", "Cocktails", "Organic"],
  },
  {
    id: "fashion",
    title: "Fashion",
    description: "Contemporary streetwear, luxury apparel, runway showcases, and editorial styling.",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    keywords: ["Streetwear", "Editorial", "Apparel", "Runway", "Vintage"],
  },
  {
    id: "people",
    title: "People",
    description: "Diverse authentic portraits, remote collaborative teams, and candid lifestyle moments.",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    keywords: ["Authentic", "Portraits", "Teamwork", "Lifestyle", "Diversity"],
  },
  {
    id: "nature",
    title: "Nature",
    description: "Breathtaking wilderness, dramatic mountain ranges, botanical macros, and serene oceans.",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    keywords: ["Landscapes", "Mountains", "Botanical", "Oceans", "Wildlife"],
  },
  {
    id: "culture",
    title: "Culture",
    description: "Global celebrations, heritage traditions, artisan craftsmanship, and urban lifestyles.",
    imageUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
    keywords: ["Traditions", "Festivals", "Artisan", "Heritage", "Celebration"],
  },
];

export const KeywordGrid: React.FC = () => {
  return (
    <section className="space-y-6 sm:space-y-8 py-8 sm:py-12 border-t border-outline-variant/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Icons.Categories size={14} />
            <span>Popular Themes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Explore curated thematic collections
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
            Jump directly into in-demand categories with trending search keywords.
          </p>
        </div>

        <Link
          to="/explore"
          className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
        >
          <span>All Themes</span>
          <Icons.Next size={14} />
        </Link>
      </div>

      {/* 6 Thematic Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {THEMES.map((theme) => (
          <div
            key={theme.id}
            className="group rounded-3xl overflow-hidden bg-surface border border-outline-variant/30 hover:border-primary/50 transition-all shadow-xs hover:shadow-lg flex flex-col"
          >
            {/* Thematic Image Container */}
            <Link
              to={`/explore?q=${encodeURIComponent(theme.title)}`}
              className="relative aspect-video w-full overflow-hidden bg-surface-container block"
            >
              <img
                src={theme.imageUrl}
                alt={theme.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent flex items-end p-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight drop-shadow-xs">
                    {theme.title}
                  </h3>
                </div>
              </div>
            </Link>

            {/* Description & Keyword Chips */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-on-surface-variant line-clamp-2">
                {theme.description}
              </p>

              {/* Keyword Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {theme.keywords.map((kw) => (
                  <Link
                    key={kw}
                    to={`/explore?q=${encodeURIComponent(kw)}`}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface-variant transition-colors border border-outline-variant/20"
                  >
                    #{kw}
                  </Link>
                ))}
              </div>

              {/* View collection link */}
              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <Link
                  to={`/explore?q=${encodeURIComponent(theme.title)}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Explore {theme.title}</span>
                  <Icons.Next size={13} />
                </Link>
                <Icons.Explore size={15} className="text-on-surface-variant/70" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default KeywordGrid;

