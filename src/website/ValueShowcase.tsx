// src/website/ValueShowcase.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { Button, Badge } from "@/components/ui/index.ts";

export const ValueShowcase: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <section className="py-12 sm:py-16 lg:py-20 border-t border-outline-variant/20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        {/* Left Column: High Quality Stock Imagery Value Propositions */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="primary" size="sm" className="gap-1.5">
              <Icons.Security size={12} />
              <span>Commercial Clearance &amp; Quality</span>
            </Badge>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-on-surface text-balance">
              Over 300 million authentic, high-resolution royalty-free assets
            </h2>

            <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
              Every photograph, vector, and 3D asset is vetted for technical
              precision, legal compliance, and production fidelity so your
              creative projects launch without friction.
            </p>
          </div>

          {/* Value Bullet Points */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <Icons.Verified size={18} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-on-surface">
                  Commercially Cleared &amp; Model Released
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Standard &amp; extended licenses include legal indemnification
                  and verified model and property releases.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary shrink-0 mt-0.5">
                <Icons.Package size={18} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-on-surface">
                  Uncompressed Production Deliverables
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Download raw deliverables: layered PSDs, vector AI/SVG files,
                  ProRes 4K footage, and PBR 3D textures.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30">
              <div className="p-2 rounded-xl bg-tertiary/10 text-tertiary shrink-0 mt-0.5">
                <Icons.Magic size={18} />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-on-surface">
                  Generative AI Studio Integration
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Instantly expand image borders, remove backgrounds, and
                  restyle colors right within your workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/featured">
              <Button
                variant="primary"
                size="md"
                rightIcon={<Icons.Next size={15} />}
              >
                Browse Curated Showcase
              </Button>
            </Link>
            <Link to="/licenses">
              <Button variant="outline" size="md">
                Review Licensing Rights
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column: Interactive AI Editing Before / After Comparison */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant px-1">
            <span className="flex items-center gap-1.5 text-primary">
              <Icons.Magic size={14} />
              <span>Interactive AI Generative Fill &amp; Expand</span>
            </span>
            <span>Drag slider or use arrow keys</span>
          </div>

          {/* Interactive Split Comparison Container */}
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden border border-outline-variant/40 shadow-xl select-none bg-surface-container">
            {/* After Image (Full width background) */}
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80"
              alt="After AI generative fill and atmospheric expansion"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute top-4 right-4 z-20 pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-primary/90 backdrop-blur-md text-on-primary text-xs font-bold shadow-md">
                After: AI Generative Expand
              </span>
            </div>

            {/* Before Image (Clipped smoothly via CSS clip-path) */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
                alt="Before original raw capture"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 z-20">
                <span className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold shadow-md">
                  Before: Raw Stock
                </span>
              </div>
            </div>

            {/* Visual Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none z-30"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-gray-900 shadow-xl flex items-center justify-center border-2 border-primary">
                <div className="flex items-center gap-0.5">
                  <Icons.Back size={12} />
                  <Icons.Next size={12} />
                </div>
              </div>
            </div>

            {/* Accessible Range Input Overlaid */}
            <input
              type="range"
              min={0}
              max={100}
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              aria-label="Image comparison slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={sliderPosition}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-40"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 px-1">
            <span>Original Landscape Shot</span>
            <span className="text-primary font-medium">
              Neural Depth &amp; Horizon Expansion
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueShowcase;
