// src/features/website/components/landing/HeroSection.tsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Zap, BadgeCheck } from "lucide-react";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/index.ts";
import { heroService } from "@/services/v1/heroService.ts";
import type { HeroImage } from "@/types/hero.ts";

export type FormatFilter = "all" | "photography" | "video";

interface FilterTab {
  label: string;
  shortLabel?: string;
  value: FormatFilter;
  categorySlug: string | null;
  path: string;
  placeholder: string;
}

const FILTER_TABS: FilterTab[] = [
  {
    label: "All",
    value: "all",
    categorySlug: null,
    path: "/explore",
    placeholder: "Search stock photos, 4K videos, vectors, 3D models...",
  },
  {
    label: "Photography & Stock Imagery",
    shortLabel: "Photography",
    value: "photography",
    categorySlug: "photography-and-stock-imagery",
    path: "/explore?category=photography-and-stock-imagery",
    placeholder: "Search stock photos, high-res portraits, textures, backdrops...",
  },
  {
    label: "Video & Motion Graphics",
    shortLabel: "Video & Motion",
    value: "video",
    categorySlug: "video-and-motion-graphics",
    path: "/explore?category=video-and-motion-graphics",
    placeholder: "Search 4K drone clips, motion graphics, video templates, slow motion...",
  },
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

  // Instant synchronous initialization from local heroImages.json (0ms delay, base64 data)
  const [heroImages, setHeroImages] = useState<HeroImage[]>(() =>
    heroService.getLocalHeroImages(),
  );

  // Background verification: check if backend database has updated images, sync and update JSON
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    heroService
      .checkAndUpdateHeroImages(controller.signal)
      .then(({ updated, images }) => {
        if (!isMounted) return;
        if (updated && images.length > 0) {
          setHeroImages(images);
        }
      })
      .catch(() => {
        // Silently preserve local JSON images
      });

    return () => {
      isMounted = false;
      controller.abort();
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

  // Build exactly 15 items: active hero images first, followed by placeholder cards if < 15
  const displayItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string | null;
      detail?: string | null;
      categoryName?: string | null;
      categorySlug?: string | null;
      imageUrl: string;
      isPlaceholder: boolean;
    }> = [];

    // Add up to 15 configured images from database / local JSON
    if (Array.isArray(heroImages)) {
      for (let i = 0; i < Math.min(heroImages.length, 15); i++) {
        const img = heroImages[i];
        if (img && img.imageUrl) {
          items.push({
            id: img.id || `hero-${i}`,
            title: img.title || "Hero Showcase",
            subtitle: img.subtitle ?? null,
            detail: img.detail ?? null,
            categoryName: img.categoryName ?? null,
            categorySlug: img.categorySlug ?? null,
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
        detail: null,
        categoryName: null,
        categorySlug: null,
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
              Curated digital assets,{" "}
              <span className="bg-linear-to-r from-amber-500 via-orange-500 to-emerald-400 bg-clip-text text-transparent">
                ready to build with
              </span>
            </h1>
            <p className="text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed text-balance">
              Discover high-quality 3D models, graphics, UI kits, templates, and digital
              products from independent creators — licensed for commercial use and delivered instantly.
            </p>
          </div>

          {/* Search Box with Tabs */}
          <div className="space-y-3 max-w-xl">
            {/* Filter Tabs (All, Photography & Stock Imagery, Video & Motion Graphics) */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-surface-container-high border border-outline-variant/30 w-fit max-w-full">
              {FILTER_TABS.map((tab) => {
                const targetUrl = searchQuery.trim()
                  ? tab.categorySlug
                    ? `/explore?category=${encodeURIComponent(tab.categorySlug)}&q=${encodeURIComponent(searchQuery.trim())}`
                    : `/explore?q=${encodeURIComponent(searchQuery.trim())}`
                  : tab.path;

                return (
                  <Link
                    key={tab.value}
                    to={targetUrl}
                    onClick={() => setActiveFormat(tab.value)}
                    className={`px-3.5 sm:px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                      activeFormat === tab.value
                        ? "bg-surface text-on-surface shadow-xs"
                        : "text-on-surface-variant hover:text-on-surface"
                    }`}
                    title={`Browse ${tab.label}`}
                  >
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
                  </Link>
                );
              })}
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
                  placeholder={
                    FILTER_TABS.find((t) => t.value === activeFormat)?.placeholder ||
                    "Search stock photos, 4K videos, vectors, 3D models..."
                  }
                  aria-label="Search digital assets"
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
          </div>

          {/* Stats / Marketplace Features & Licensing Row */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 border-t border-outline-variant/20 max-w-xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck size={20} className="text-primary" />
              </div>
              <div>
                <div className="text-base sm:text-xl font-black text-on-surface leading-tight">
                  Licensed
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5">
                  Commercial rights
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Zap size={20} className="text-amber-500" />
              </div>
              <div>
                <div className="text-base sm:text-xl font-black text-on-surface leading-tight">
                  Instant
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5">
                  Direct downloads
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <BadgeCheck size={20} className="text-emerald-500" />
              </div>
              <div>
                <div className="text-base sm:text-xl font-black text-on-surface leading-tight">
                  Curated
                </div>
                <div className="text-xs text-on-surface-variant mt-0.5">
                  Verified creators
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 15-Image Sliding & Animating Showcase */}
        <div className="lg:col-span-6 relative h-130 sm:h-150 w-full overflow-hidden rounded-3xl select-none">
          {/* Top & Bottom Smooth Gradient Fade Masks */}
          <div className="absolute top-0 inset-x-0 h-16 bg-linear-to-b from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-16 bg-linear-to-t from-background to-transparent z-20 pointer-events-none" />

          {/* 3 Sliding Columns Container */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 h-full">
            {/* Column 1 (Items 0..4) — slides up */}
            <div className="hero-col relative overflow-hidden h-full">
              <div className="hero-track hero-slide-up flex flex-col gap-3 sm:gap-4">
                {[...column1, ...column1].map((item, idx) => (
                  <HeroSlideCard
                    key={`col1-${item?.id || idx}-${idx}`}
                    item={item}
                    isPriority={idx === 0}
                  />
                ))}
              </div>
            </div>

            {/* Column 2 (Items 5..9) — slides down */}
            <div className="hero-col relative overflow-hidden h-full">
              <div className="hero-track hero-slide-down flex flex-col gap-3 sm:gap-4">
                {[...column2, ...column2].map((item, idx) => (
                  <HeroSlideCard
                    key={`col2-${item?.id || idx}-${idx}`}
                    item={item}
                  />
                ))}
              </div>
            </div>

            {/* Column 3 (Items 10..14) — slides up offset */}
            <div className="hero-col relative overflow-hidden h-full">
              <div className="hero-track hero-slide-up-offset flex flex-col gap-3 sm:gap-4">
                {[...column3, ...column3].map((item, idx) => (
                  <HeroSlideCard
                    key={`col3-${item?.id || idx}-${idx}`}
                    item={item}
                  />
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
    detail?: string | null;
    categoryName?: string | null;
    categorySlug?: string | null;
    imageUrl: string;
    isPlaceholder: boolean;
  };
  isPriority?: boolean;
}

const HeroSlideCard: React.FC<SlideCardProps> = ({ item, isPriority = false }) => {
  if (!item) return null;

  // Determine redirect URL for this image's category
  const targetCategorySlug =
    item.categorySlug ||
    (item.categoryName
      ? encodeURIComponent(item.categoryName.toLowerCase().replace(/\s+/g, "-"))
      : null);

  const targetUrl = targetCategorySlug
    ? `/explore?category=${encodeURIComponent(targetCategorySlug)}`
    : "/explore";

  const cardContent = (
    <div
      title={
        item.categoryName
          ? `Explore ${item.categoryName} — ${item.detail || item.title}`
          : item.detail || item.title
      }
      className="relative aspect-3/4 w-full rounded-2xl overflow-hidden border border-outline-variant/30 hover:border-primary/60 bg-surface-container-high shadow-md hover:shadow-xl shrink-0 group transition-all duration-300 cursor-pointer block"
    >
      <img
        src={item.imageUrl}
        alt={item.detail || item.title}
        width={300}
        height={400}
        loading={isPriority ? "eager" : "lazy"}
        {...(isPriority ? { fetchPriority: "high" } : { fetchPriority: "low" })}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
      />

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/25 to-transparent pointer-events-none group-hover:from-black/90 transition-colors" />

      {/* Top Glassmorphism Pill / Tag */}
      {(item.categoryName || item.subtitle) && (
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-xs flex items-center gap-1 group-hover:bg-primary group-hover:text-on-primary transition-colors">
            <Icons.Layers size={10} className="opacity-80" />
            <span>{item.categoryName || item.subtitle}</span>
          </span>
        </div>
      )}

      {/* Bottom Title Label & Category Explore Indicator */}
      <div className="absolute bottom-2.5 inset-x-2.5 text-white z-10">
        <p className="text-[11px] font-bold truncate drop-shadow-sm group-hover:text-primary-container transition-colors">
          {item.title}
        </p>
        {item.detail && (
          <p className="text-[9px] text-white/80 line-clamp-1 drop-shadow-sm mt-0.5">
            {item.detail}
          </p>
        )}
        <div className="flex items-center gap-1 text-[9px] font-semibold text-primary/90 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Explore {item.categoryName || "Category"}</span>
          <Icons.Next size={10} />
        </div>
      </div>
    </div>
  );

  if (item.isPlaceholder) {
    return <div className="shrink-0">{cardContent}</div>;
  }

  return (
    <Link
      to={targetUrl}
      className="shrink-0 block transform transition-transform hover:-translate-y-1 focus:outline-hidden"
      aria-label={`Explore ${item.categoryName || item.title} category`}
    >
      {cardContent}
    </Link>
  );
};

export default HeroSection;
