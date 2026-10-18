// src/components/common/WatermarkOverlay.tsx
import React, { useId } from "react";
import { Icons } from "@/lib/icons/index.ts";
import { useOrganization } from "@/hooks/useOrganization.ts";

export interface WatermarkOverlayProps {
  /** Size variant: 'sm' for thumbnails, 'md' for cards/grids, 'lg' for detail showcases */
  size?: "sm" | "md" | "lg";
  /** Custom watermark brand text; defaults to organization title or 'AssetDrop' */
  text?: string;
  /** Whether to render the central frosted security seal/emblem */
  showCenterBadge?: boolean;
  /** Whether to render the floating corner 'Protected Preview' pill */
  showCornerBadge?: boolean;
  /** Whether to enable transparent pointer shield to block right-click saving */
  interactiveShield?: boolean;
  /** Additional custom classes */
  className?: string;
}

/**
 * WatermarkOverlay renders an anti-theft, anti-screenshot watermark layer
 * over preview media using SVG repeating patterns, diagonal security gridlines,
 * and high-contrast dual-stroke typography visible on both dark and light imagery.
 */
export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  size = "lg",
  text,
  showCenterBadge,
  showCornerBadge,
  interactiveShield,
  className = "",
}) => {
  const { organization } = useOrganization();
  const rawId = useId();
  // Sanitize React useId for SVG ID compatibility
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const patternId = `wm-pattern-${safeId}`;

  const isPlaceholder = (val?: string | null) =>
    !val || val.trim().toLowerCase() === "assetdrop";

  let brand = text;
  if (!brand || isPlaceholder(brand)) {
    if (organization?.title && !isPlaceholder(organization.title)) {
      brand = organization.title;
    } else if (organization?.name && !isPlaceholder(organization.name)) {
      brand = organization.name;
    } else if (organization?.shortName && !isPlaceholder(organization.shortName)) {
      brand = organization.shortName;
    } else {
      brand = organization?.title || organization?.name || organization?.shortName || "AssetDrop";
    }
  }

  const displayBrand = brand.toUpperCase();

  const isLg = size === "lg";
  const isSm = size === "sm";

  const shouldShowCenter = showCenterBadge ?? isLg;
  const shouldShowCorner = showCornerBadge ?? isLg;
  const shouldEnableShield = interactiveShield ?? isLg;

  // Adaptive pattern sizing based on display variant
  const patternWidth = isSm ? 120 : isLg ? 260 : 180;
  const patternHeight = isSm ? 70 : isLg ? 150 : 100;
  const mainFontSize = isSm ? 10 : isLg ? 16 : 13;
  const subFontSize = isSm ? 7 : isLg ? 10 : 8.5;

  return (
    <div
      aria-hidden="true"
      data-testid="watermark-overlay"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={`absolute inset-0 z-10 overflow-hidden select-none ${className}`}
    >
      {/* Repeating SVG Watermark Pattern Overlay */}
      <svg
        className="absolute inset-0 h-full w-full pointer-events-none select-none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={patternId}
            width={patternWidth}
            height={patternHeight}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-26)"
          >
            {/* Subtle dashed divider line across the pattern */}
            <line
              x1="0"
              y1={patternHeight / 2}
              x2={patternWidth}
              y2={patternHeight / 2}
              stroke="rgba(255, 255, 255, 0.18)"
              strokeDasharray="4 6"
              strokeWidth="0.8"
            />

            {/* Primary Brand Text with dual fill/stroke for high contrast on light & dark media */}
            <text
              x={patternWidth / 2}
              y={patternHeight * 0.32}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255, 255, 255, 0.42)"
              stroke="rgba(0, 0, 0, 0.45)"
              strokeWidth="0.75"
              paintOrder="stroke fill"
              fontSize={mainFontSize}
              fontWeight="800"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="0.14em"
            >
              {displayBrand}
            </text>

            {/* Secondary Protection Text */}
            <text
              x={patternWidth / 2}
              y={patternHeight * 0.78}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255, 255, 255, 0.36)"
              stroke="rgba(0, 0, 0, 0.42)"
              strokeWidth="0.55"
              paintOrder="stroke fill"
              fontSize={subFontSize}
              fontWeight="700"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              letterSpacing="0.08em"
            >
              {isSm ? "PREVIEW" : "PREVIEW ONLY • DO NOT COPY"}
            </text>
          </pattern>
        </defs>

        {/* Tiled Pattern Rect */}
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />

        {/* Diagonal Crosslines across the entire canvas for large showcase display */}
        {isLg && (
          <>
            <line
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeDasharray="6 8"
              strokeWidth="1.2"
            />
            <line
              x1="100%"
              y1="0%"
              x2="0%"
              y2="100%"
              stroke="rgba(255, 255, 255, 0.16)"
              strokeDasharray="6 8"
              strokeWidth="1.2"
            />
          </>
        )}
      </svg>

      {/* Central Security Seal / Watermark Emblem */}
      {shouldShowCenter && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none p-4">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/20 text-white shadow-2xl">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Icons.Security size={20} className="text-white" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-widest uppercase drop-shadow-sm">
                {displayBrand}
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-white/80 uppercase">
                Protected Digital Preview
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Corner 'Protected Preview' Pill */}
      {shouldShowCorner && (
        <div className="absolute top-3 right-3 pointer-events-none select-none z-20">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold tracking-wide shadow-md">
            <Icons.Lock size={12} className="text-white/90" />
            <span>Watermarked Preview</span>
          </div>
        </div>
      )}

      {/* Transparent Click & Drag Shield to block casual right-click saving */}
      {shouldEnableShield && (
        <div
          className="absolute inset-0 bg-transparent cursor-default pointer-events-auto"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default WatermarkOverlay;

