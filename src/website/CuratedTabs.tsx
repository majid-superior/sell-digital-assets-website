// src/website/CuratedTabs.tsx
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Icons } from "@/lib/icons/index.ts";
import { Badge, Button } from "@/components/ui/index.ts";
import { assetService } from "@/services/v1/assetService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import type { DigitalAsset } from "@/types/asset.ts";

export type CollectionTab = "Video" | "Photo" | "Vectors" | "Template" | "Illustration" | "3D";

interface CollectionItem {
  id: string;
  title: string;
  creator: string;
  badge: string;
  format: string;
  imageUrl: string;
  slug?: string;
  price?: string;
}

const TAB_DATA: Record<CollectionTab, { description: string; categorySlug: string; items: CollectionItem[] }> = {
  Video: {
    description: "Cinematic 4K drone footage, slow-motion nature, time-lapses, and urban reels.",
    categorySlug: "videos",
    items: [
      {
        id: "vid-1",
        title: "Aerial Coastal Sunset Horizon in 4K UHD",
        creator: "AeroVision Studio",
        badge: "4K UHD ProRes",
        format: "Video MP4",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        price: "$29",
      },
      {
        id: "vid-2",
        title: "Neon Cyberpunk Metropolis Rain Reflections",
        creator: "FutureWave FX",
        badge: "60 FPS Raw",
        format: "Video ProRes",
        imageUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80",
        price: "$39",
      },
      {
        id: "vid-3",
        title: "Abstract Liquid Gold Macro Motion",
        creator: "VividMotion",
        badge: "120 FPS Slow-Mo",
        format: "Video H.265",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        price: "$24",
      },
      {
        id: "vid-4",
        title: "Foggy Alpine Forest Mountain Range",
        creator: "NatureCine Labs",
        badge: "8K Master",
        format: "Video RAW",
        imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
        price: "$34",
      },
    ],
  },
  Photo: {
    description: "Authentic, model-released commercial photography and editorial portraits.",
    categorySlug: "photos",
    items: [
      {
        id: "pho-1",
        title: "Contemporary Minimalist Architecture Facade",
        creator: "Studio Bauhaus",
        badge: "High Resolution",
        format: "RAW 45MP",
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        price: "$19",
      },
      {
        id: "pho-2",
        title: "Diverse Creative Team Collaborating in Studio",
        creator: "CultureLens",
        badge: "Model Released",
        format: "JPEG 6000x4000",
        imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
        price: "$25",
      },
      {
        id: "pho-3",
        title: "Artisan Specialty Pour-Over Coffee Brew",
        creator: "BaristaFrame",
        badge: "Editorial Grade",
        format: "RAW / DNG",
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
        price: "$14",
      },
      {
        id: "pho-4",
        title: "Scandinavian Interior Living Space Warmth",
        creator: "NordicDesign",
        badge: "Commercial License",
        format: "TIFF 16-Bit",
        imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
        price: "$22",
      },
    ],
  },
  Vectors: {
    description: "Infinitely scalable vector illustrations, icon sets, and responsive badges.",
    categorySlug: "vectors",
    items: [
      {
        id: "vec-1",
        title: "Fintech & Crypto Essential Line Icon System",
        creator: "PixelGrid Pro",
        badge: "1,200+ Icons",
        format: "SVG / EPS / AI",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
        price: "$18",
      },
      {
        id: "vec-2",
        title: "Isometric Smart City Transportation Infrastructure",
        creator: "IsoVector Lab",
        badge: "Scalable Vector",
        format: "AI / SVG",
        imageUrl: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80",
        price: "$24",
      },
      {
        id: "vec-3",
        title: "Modern Fluid Gradient Wave Patterns",
        creator: "AestheticVectors",
        badge: "Seamless Vector",
        format: "EPS 10",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        price: "$15",
      },
      {
        id: "vec-4",
        title: "Botanical Wildflower Silhouette Stamp Pack",
        creator: "FloraDesign",
        badge: "Print Ready",
        format: "SVG / PDF",
        imageUrl: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
        price: "$16",
      },
    ],
  },
  Template: {
    description: "Production-ready UI design systems, social media bundles, and presentation decks.",
    categorySlug: "templates",
    items: [
      {
        id: "tem-1",
        title: "SaaS Enterprise Dashboard UI Kit & Components",
        creator: "DesignTokens UI",
        badge: "Figma 2026",
        format: "Figma / Auto-Layout",
        imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
        price: "$35",
      },
      {
        id: "tem-2",
        title: "Modern Minimal Brand Identity Guidelines Deck",
        creator: "IdentityWorks",
        badge: "InDesign + Figma",
        format: "INDD / FIG / PDF",
        imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=800&q=80",
        price: "$28",
      },
      {
        id: "tem-3",
        title: "E-Commerce Mobile App UI Component Library",
        creator: "MobileCraft",
        badge: "iOS & Android",
        format: "Figma / Sketch",
        imageUrl: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80",
        price: "$32",
      },
      {
        id: "tem-4",
        title: "Pitch Deck Masterclass Keynote & Slides",
        creator: "VentureDecks",
        badge: "16:9 Presentation",
        format: "PPTX / Keynote",
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
        price: "$20",
      },
    ],
  },
  Illustration: {
    description: "Story-driven character art, concept designs, and hand-drawn digital assets.",
    categorySlug: "illustrations",
    items: [
      {
        id: "ill-1",
        title: "Whimsical Digital Nomad Character Story Pack",
        creator: "ChromaIllustrations",
        badge: "Vector Story",
        format: "AI / SVG / PNG",
        imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
        price: "$22",
      },
      {
        id: "ill-2",
        title: "Sci-Fi Space Exploration Concept Art Series",
        creator: "CosmoArt",
        badge: "High-Res Art",
        format: "PSD / PNG 8K",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
        price: "$26",
      },
      {
        id: "ill-3",
        title: "Hand-Drawn Culinary Ingredients & Botanicals",
        creator: "ArtisanInk",
        badge: "Transparent PNGs",
        format: "Procreate / PNG",
        imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80",
        price: "$17",
      },
      {
        id: "ill-4",
        title: "Abstract Geometric Bauhaus Fine Art Prints",
        creator: "ModernAtelier",
        badge: "Print Ready 300DPI",
        format: "Vector + Raster",
        imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80",
        price: "$19",
      },
    ],
  },
  "3D": {
    description: "PBR textured 3D meshes, low-poly game assets, and architectural renderings.",
    categorySlug: "3d-models",
    items: [
      {
        id: "3d-1",
        title: "Futuristic Cyber Mecha Robot Rigged & Animated",
        creator: "PolyForge 3D",
        badge: "Rigged & Textured",
        format: "GLB / FBX / Blend",
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
        price: "$45",
      },
      {
        id: "3d-2",
        title: "Photorealistic Clay Device Mockup Bundle",
        creator: "RenderLab",
        badge: "Cinema 4D + Cycles",
        format: "C4D / OBJ / Blend",
        imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80",
        price: "$38",
      },
      {
        id: "3d-3",
        title: "Low-Poly Cozy Fantasy Village Environment",
        creator: "GameAssetFactory",
        badge: "Unity & Unreal Ready",
        format: "FBX / UnityPackage",
        imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
        price: "$30",
      },
      {
        id: "3d-4",
        title: "Hyper-Detailed Glass & Chrome Geometric Spheres",
        creator: "PrismRenders",
        badge: "PBR 4K Textures",
        format: "USDZ / GLTF",
        imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80",
        price: "$27",
      },
    ],
  },
};

const TABS: CollectionTab[] = ["Video", "Photo", "Vectors", "Template", "Illustration", "3D"];

export const CuratedTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CollectionTab>("Video");
  const scrollRef = useRef<HTMLDivElement>(null);

  // TanStack Query to blend in live featured assets if available
  const { data: featuredAssets } = useQuery<DigitalAsset[]>({
    queryKey: queryKeys.assets.featured(),
    queryFn: () => assetService.getFeaturedAssets(),
    staleTime: 1000 * 60 * 5,
  });

  const tabConfig = TAB_DATA[activeTab];

  // Blend in live featured assets from backend when available
  const displayItems: CollectionItem[] = [
    ...tabConfig.items,
    ...(featuredAssets || [])
      .filter((fa) => fa.media?.some((m) => m.media_type === "thumbnail"))
      .slice(0, 2)
      .map((fa) => {
        const thumb = fa.media?.find((m) => m.media_type === "thumbnail");
        const minPrice = fa.tiers?.length ? Math.min(...fa.tiers.map((t) => Number(t.price))) : 19;
        return {
          id: `live-${fa.id}`,
          title: fa.title,
          creator: fa.sellerProfile?.storeName || "Verified Creator",
          badge: "Live Asset",
          format: activeTab,
          imageUrl: thumb?.url || tabConfig.items[0].imageUrl,
          price: `$${minPrice}`,
        };
      }),
  ];

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -offset : offset,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-6 sm:space-y-8 py-8 sm:py-12 border-t border-outline-variant/20">
      {/* Header and Tab Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
            <Icons.Magic size={14} />
            <span>Curated Collections</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
            Fresh creative assets by format
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-xl">
            {tabConfig.description}
          </p>
        </div>

        {/* Carousel Prev/Next Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Previous items"
            className="p-2 rounded-full border border-outline-variant/40 hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
          >
            <Icons.Back size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Next items"
            className="p-2 rounded-full border border-outline-variant/40 hover:bg-surface-container-high text-on-surface transition-colors cursor-pointer"
          >
            <Icons.Next size={16} />
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div
        role="tablist"
        aria-label="Asset category tabs"
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Horizontal Carousel Scroller */}
      <div
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="snap-start shrink-0 w-72 sm:w-80 group rounded-2xl overflow-hidden bg-surface border border-outline-variant/30 hover:border-primary/50 transition-all shadow-xs hover:shadow-md flex flex-col"
          >
            {/* Thumbnail Image Container */}
            <div className="relative aspect-16/10 w-full overflow-hidden bg-surface-container">
              <img
                src={item.imageUrl}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                <Badge variant="secondary" size="sm" className="backdrop-blur-md bg-black/60 text-white border-none text-[10px]">
                  {item.badge}
                </Badge>
              </div>
              <div className="absolute bottom-2.5 right-2.5">
                <span className="px-2 py-0.5 rounded-md bg-surface/90 backdrop-blur-md text-on-surface text-xs font-bold shadow-xs">
                  {item.price}
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] font-medium text-primary uppercase tracking-wide">
                  {item.format}
                </span>
                <h3 className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <span className="text-xs text-on-surface-variant block mt-0.5">
                  by {item.creator}
                </span>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <Link
                  to={`/explore?category=${encodeURIComponent(tabConfig.categorySlug)}`}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Explore Similar</span>
                  <Icons.Next size={13} />
                </Link>

                <Link
                  to={`/explore?category=${encodeURIComponent(tabConfig.categorySlug)}`}
                  className="p-1.5 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface transition-colors"
                  aria-label={`View ${item.title}`}
                >
                  <Icons.Explore size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom link to view full collection */}
      <div className="flex justify-center pt-2">
        <Link to={`/explore?category=${encodeURIComponent(tabConfig.categorySlug)}`}>
          <Button variant="outline" size="md" rightIcon={<Icons.Next size={15} />}>
            View all {activeTab} assets
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CuratedTabs;
