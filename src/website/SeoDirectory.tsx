// src/website/SeoDirectory.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";

interface DirectoryColumn {
  title: string;
  links: Array<{ label: string; href: string }>;
}

const DIRECTORY_COLUMNS: DirectoryColumn[] = [
  {
    title: "Stock Asset Formats",
    links: [
      { label: "High-Resolution Photos", href: "/explore?category=photos" },
      { label: "Scalable Vector Graphics", href: "/explore?category=vectors" },
      { label: "Hand-Drawn Illustrations", href: "/explore?category=illustrations" },
      { label: "4K & 8K Video Footage", href: "/explore?category=videos" },
      { label: "Rigged 3D Models & PBR", href: "/explore?category=3d-models" },
      { label: "Figma & UI Web Kits", href: "/explore?category=ui-web-kits" },
      { label: "Presentation Slide Decks", href: "/explore?category=templates" },
      { label: "Motion Graphics & VFX", href: "/explore?category=video-templates" },
    ],
  },
  {
    title: "Trending Themes",
    links: [
      { label: "Abstract 3D Gradients", href: "/explore?q=Abstract%203D" },
      { label: "Cyberpunk & Neon Cities", href: "/explore?q=Cyberpunk" },
      { label: "Clean Minimalist Spaces", href: "/explore?q=Minimalist" },
      { label: "Authentic Candid People", href: "/explore?q=People" },
      { label: "Artisan Coffee & Culinary", href: "/explore?q=Food" },
      { label: "Wilderness & Alpine Nature", href: "/explore?q=Nature" },
      { label: "Sustainable Eco Energy", href: "/explore?q=Sustainability" },
      { label: "Retro & Vintage Film Grain", href: "/explore?q=Vintage" },
    ],
  },
  {
    title: "Industry Verticals",
    links: [
      { label: "SaaS & Cloud Startups", href: "/explore?q=SaaS" },
      { label: "Fintech, Crypto & Banking", href: "/explore?q=Fintech" },
      { label: "Healthcare & Biotech", href: "/explore?q=Healthcare" },
      { label: "Modern Real Estate", href: "/explore?q=Real%20Estate" },
      { label: "E-Commerce & Digital Retail", href: "/explore?q=Ecommerce" },
      { label: "Higher Education & Learning", href: "/explore?q=Education" },
      { label: "Sports & Peak Athletics", href: "/explore?q=Sports" },
      { label: "Hospitality & Global Travel", href: "/explore?q=Travel" },
    ],
  },
  {
    title: "AI Studio Tools",
    links: [
      { label: "Generative Text-to-Image", href: "/explore?ai=true" },
      { label: "AI Generative Expand", href: "/explore?ai=expand" },
      { label: "Neural Background Removal", href: "/explore?ai=remove-bg" },
      { label: "4K Resolution Upscaling", href: "/explore?ai=upscale" },
      { label: "Vector Path Synthesis", href: "/explore?ai=vectorize" },
      { label: "Color Palette Harmonizer", href: "/explore?ai=color" },
      { label: "PBR Material Synthesis", href: "/explore?ai=3d-texture" },
      { label: "Commercial Safety Guarantee", href: "/licenses" },
    ],
  },
  {
    title: "Licensing & Support",
    links: [
      { label: "Royalty-Free Standard License", href: "/licenses" },
      { label: "Extended Commercial Rights", href: "/licenses" },
      { label: "Creator Contributor Portal", href: "/creator-guidelines" },
      { label: "Seller Commission Structure", href: "/payouts" },
      { label: "Marketplace Developer API", href: "/api-docs" },
      { label: "Enterprise Volume Pooling", href: "/about" },
      { label: "Copyright Indemnification", href: "/security" },
      { label: "Customer Support Desk", href: "/help" },
    ],
  },
];

export const SeoDirectory: React.FC = () => {
  return (
    <section className="py-8 sm:py-12 border-t border-outline-variant/20">
      {/* Header */}
      <div className="space-y-1.5 mb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Icons.Explore size={14} />
          <span>SEO Directory &amp; Catalog Index</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-on-surface">
          Explore Popular Stock Media Categories &amp; Creative Topics
        </h2>
        <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl">
          Quick-access links across all digital formats, commercial themes, and production resources.
        </p>
      </div>

      {/* Directory 5-column layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
        {DIRECTORY_COLUMNS.map((col) => (
          <div key={col.title} className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface border-b border-outline-variant/20 pb-2">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-xs text-on-surface-variant hover:text-primary transition-colors block truncate"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SeoDirectory;

