// src/features/website/components/landing/HeroSection.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/index.ts";
import { heroService } from "@/services/v1/heroService.ts";
import type { HeroImage } from "@/types/hero.ts";

export type FormatFilter = "all" | "photos" | "videos";

interface FilterTab {
  label: string;
  value: FormatFilter;
  categorySlug?: string;
}

const FILTER_TABS: FilterTab[] = [
  { label: "All", value: "all" },
  { label: "Photos", value: "photos", categorySlug: "photos" },
  { label: "Videos", value: "videos", categorySlug: "videos" },
];

const TRENDING_SEARCHES = [
  "Nature",
  "4K drone",
  "Business",
  "Abstract",
  "Cityscape",
  "Slow motion",
];

// Clean dark placeholder SVG for unconfigured slots
const EMPTY_PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg width="400" height="520" viewBox="0 0 400 520" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="520" fill="#18181b"/>
      <rect x="16" y="16" width="368" height="488" rx="20" stroke="#27272a" stroke-width="2" stroke-dasharray="8 8"/>
      <circle cx="200" cy="225" r="44" fill="#27272a"/>
      <path d="M185 228L196 239L214 216L225 228" stroke="#71717a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="188" cy="210" r="5" fill="#71717a"/>
      <text x="200" y="300" text-anchor="middle" fill="#a1a1aa" font-family="sans-serif" font-size="13" font-weight="600">
        Empty Showcase Slot
      </text>
      <text x="200" y="322" text-anchor="middle" fill="#71717a" font-family="sans-serif" font-size="11">
        Configure in Admin Panel
      </text>
    </svg>
  `);

export const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const [activeFormat, setActiveFormat] = useState<FormatFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);

  // Fetch active hero images from backend
  useEffect(() => {
    let isMounted = true;
    heroService
      .getActiveHeroImages()
      .then((data) => {
        if (!isMounted) return;
        setHeroImages(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setHeroImages([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    const activeTab = FILTER_TABS.find((t) => t.value === activeFormat);
    const categoryParam = activeTab?.categorySlug
      ? `&category=${encodeURIComponent(activeTab.categorySlug)}`
      : "";

    if (query) {
      void navigate(`/explore?q=${encodeURIComponent(query)}${categoryParam}`);
    } else if (activeTab?.categorySlug) {
      void navigate(
        `/explore?category=${encodeURIComponent(activeTab.categorySlug)}`,
      );
    } else {
      void navigate("/explore");
    }
  };

  // Build exactly 15 items: backend active images first, followed by placeholder cards
  const displayItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string | null;
      imageUrl: string;
      isPlaceholder: boolean;
    }> = [];

    // Add up to 15 configured images from database
    if (Array.isArray(heroImages)) {
      for (let i = 0; i < Math.min(heroImages.length, 15); i++) {
        const img = heroImages[i];
        if (img && img.imageUrl) {
          items.push({
            id: img.id || `hero-${i}`,
            title: img.title || "Hero Showcase",
            subtitle: img.subtitle ?? null,
            imageUrl: img.imageUrl,
            isPlaceholder: false,
          });
        }
      }
    }

    // Fill remaining slots up to 15 with empty placeholder images
    const remaining = Math.max(0, 15 - items.length);
    for (let i = 0; i < remaining; i++) {
      items.push({
        id: `placeholder-${i}`,
        title: "Available Slot",
        subtitle: "Empty",
        imageUrl: EMPTY_PLACEHOLDER_IMAGE,
        isPlaceholder: true,
      });
    }

    return items;
  }, [heroImages]);

  // Split into 3 columns of 5 images each (3 x 5 = 15)
  const column1 = displayItems.slice(0, 5);
  const column2 = displayItems.slice(5, 10);
  const column3 = displayItems.slice(10, 15);

  return (
    <section className="relative w-full pt-4 pb-12 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20 overflow-hidden">
      {/* Dynamic Keyframe Style Declarations */}
      <style>{`
        @keyframes hero-marquee-up {
          0% { transform: translateY(0%); }
          100% { transform: translateY(-50%); }
        }
        @keyframes hero-marquee-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0%); }
        }
        .hero-slide-up {
          animation: hero-marquee-up 38s linear infinite;
        }
        .hero-slide-down {
          animation: hero-marquee-down 42s linear infinite;
        }
        .hero-slide-up-offset {
          animation: hero-marquee-up 46s linear infinite;
        }
        .hero-col:hover .hero-track {
          animation-play-state: paused;
        }
      `}</style>

      {/* Background ambient gradient glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-120 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Headlines, Filters, Search & Value Indicators */}
        <div className="lg:col-span-6 space-y-6 sm:space-y-7 text-left">
          {/* Creator Pill Badge */}
          <div>
            <Link
              to="/signup?role=seller"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-surface-container-high border border-outline-variant/40 text-on-surface hover:border-primary/50 transition-colors"
            >
              <span className="p-1 rounded-full bg-primary/20 text-primary">
                <Icons.Sell size={12} />
              </span>
              <span>Are you a creator?</span>
              <span className="font-bold text-primary underline underline-offset-2">
                Start selling your work
              </span>
            </Link>
          </div>

          {/* Main Headline with Highlighted Gradient */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-on-surface leading-[1.1] text-balance">
              Stunning photos &amp; videos,{" "}
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 bg-clip-text text-transparent">
                ready to create with
              </span>
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed text-balance">
              Royalty-free 4K footage, high-resolution photography, and creative
              assets from independent creators — licensed in one click,
              downloaded instantly.
            </p>
          </div>

          {/* Search Box with Tabs */}
          <div className="space-y-3 max-w-xl">
            {/* Filter Tabs (All, Photos, Videos) */}
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-surface-container-high border border-outline-variant/30 w-fit">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveFormat(tab.value)}
                  className={`px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeFormat === tab.value
                      ? "bg-surface text-on-surface shadow-xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Input Form with Red/Orange Accent Search Button */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center bg-surface border border-outline-variant/40 rounded-2xl p-1.5 shadow-lg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all"
            >
              <div className="flex-1 flex items-center px-3 min-w-0">
                <Icons.Search
                  size={18}
                  className="text-on-surface-variant/70 shrink-0 mr-2.5"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stock photos, 4K videos, vectors..."
                  aria-label="Search stock assets"
                  className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-hidden py-2"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search query"
                    className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <Icons.Close size={15} />
                  </button>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                rightIcon={<Icons.Next size={14} />}
                className="rounded-xl px-5 font-bold shrink-0 bg-primary hover:opacity-95 text-on-primary"
              >
                Search
              </Button>
            </form>

            {/* Trending Keywords */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-on-surface-variant pt-1">
              <span className="font-semibold text-on-surface">Trending:</span>
              {TRENDING_SEARCHES.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() =>
                    void navigate(`/explore?q=${encodeURIComponent(keyword)}`)
                  }
                  className="px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/20 hover:border-primary hover:text-primary transition-colors cursor-pointer text-[11px]"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Summary Row */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-outline-variant/20 max-w-xl">
            <div>
              <div className="text-xl sm:text-2xl font-black text-on-surface">
                2M+
              </div>
              <div className="text-xs text-on-surface-variant">
                Photos &amp; clips
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-on-surface">
                4K
              </div>
              <div className="text-xs text-on-surface-variant">
                Video quality
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-on-surface">
                100%
              </div>
              <div className="text-xs text-on-surface-variant">
                Royalty-free
              </div>
            </div>
          </div>

          {/* Bottom Creator Link */}
          {/* <div className="pt-1">
            <Link
              to="/signup?role=seller"
              className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface hover:text-primary transition-colors"
            >
              <span>Are you a creator?</span>
              <span className="underline underline-offset-2">Start selling your work ↗</span>
            </Link>
          </div> */}
        </div>

        {/* Right Column: 15-Image Sliding & Animating Showcase */}
        <div className="lg:col-span-6 relative h-[520px] sm:h-[600px] w-full overflow-hidden rounded-3xl select-none">
          {/* Top & Bottom Smooth Gradient Fade Masks */}
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />

          {/* 3 Sliding Columns Container */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 h-full">
            {/* Column 1 (Items 0..4) — slides up */}
            <div className="hero-col relative overflow-hidden h-full">
              <div className="hero-track hero-slide-up flex flex-col gap-3 sm:gap-4">
                {[...column1, ...column1].map((item, idx) => (
                  <HeroSlideCard key={`col1-${item?.id || idx}-${idx}`} item={item} />
                ))}
              </div>
            </div>

            {/* Column 2 (Items 5..9) — slides down */}
            <div className="hero-col relative overflow-hidden h-full">
              <div className="hero-track hero-slide-down flex flex-col gap-3 sm:gap-4">
                {[...column2, ...column2].map((item, idx) => (
                  <HeroSlideCard key={`col2-${item?.id || idx}-${idx}`} item={item} />
                ))}
              </div>
            </div>

            {/* Column 3 (Items 10..14) — slides up offset */}
            <div className="hero-col relative overflow-hidden h-full">
              <div className="hero-track hero-slide-up-offset flex flex-col gap-3 sm:gap-4">
                {[...column3, ...column3].map((item, idx) => (
                  <HeroSlideCard key={`col3-${item?.id || idx}-${idx}`} item={item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

interface SlideCardProps {
  item?: {
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    isPlaceholder: boolean;
  };
}

const HeroSlideCard: React.FC<SlideCardProps> = ({ item }) => {
  if (!item) return null;
  return (
    <div className="relative aspect-3/4 w-full rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-high shadow-md shrink-0 group">
      <img
        src={item.imageUrl}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

      {/* Top Glassmorphism Pill / Tag */}
      {item.subtitle && (
        <div className="absolute top-2 left-2 pointer-events-none">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-xs">
            {item.subtitle}
          </span>
        </div>
      )}

      {/* Bottom Title Label */}
      <div className="absolute bottom-2 inset-x-2 pointer-events-none text-white">
        <p className="text-[11px] font-bold truncate drop-shadow-sm">
          {item.title}
        </p>
      </div>
    </div>
  );
};

export default HeroSection;
