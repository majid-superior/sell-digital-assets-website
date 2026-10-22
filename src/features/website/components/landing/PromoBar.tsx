// src/features/website/components/landing/PromoBar.tsx
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { useBanners } from "@/hooks/useBanners.ts";
import {
  isBannerEligibleNow,
  isSafeBannerUrl,
} from "@/services/v1/bannerService.ts";
import type {
  BannerAppearance,
  BannerBadgeType,
  PublicBanner,
} from "@/types/banner.ts";

const DISMISSED_STORAGE_KEY = "dismissed_promo_banners";

function getStoredDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((x): x is string => typeof x === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

function persistDismissedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      DISMISSED_STORAGE_KEY,
      JSON.stringify(Array.from(ids)),
    );
  } catch {
    // Ignore storage quota errors
  }
}

interface AppearanceThemeClasses {
  container: string;
  badge: string;
  supporting: string;
  cta: string;
  control: string;
}

const APPEARANCE_STYLES: Record<BannerAppearance, AppearanceThemeClasses> = {
  primary: {
    container:
      "bg-primary text-on-primary border-b border-primary/20 shadow-xs",
    badge: "bg-on-primary/15 text-on-primary",
    supporting:
      "bg-on-primary/15 text-on-primary border border-on-primary/20",
    cta: "bg-on-primary text-primary hover:opacity-90",
    control:
      "text-on-primary/80 hover:text-on-primary hover:bg-on-primary/10",
  },
  secondary: {
    container:
      "bg-secondary text-on-secondary border-b border-secondary/20 shadow-xs",
    badge: "bg-on-secondary/15 text-on-secondary",
    supporting:
      "bg-on-secondary/15 text-on-secondary border border-on-secondary/20",
    cta: "bg-on-secondary text-secondary hover:opacity-90",
    control:
      "text-on-secondary/80 hover:text-on-secondary hover:bg-on-secondary/10",
  },
  tertiary: {
    container:
      "bg-tertiary text-on-tertiary border-b border-tertiary/20 shadow-xs",
    badge: "bg-on-tertiary/15 text-on-tertiary",
    supporting:
      "bg-on-tertiary/15 text-on-tertiary border border-on-tertiary/20",
    cta: "bg-on-tertiary text-tertiary hover:opacity-90",
    control:
      "text-on-tertiary/80 hover:text-on-tertiary hover:bg-on-tertiary/10",
  },
  accent: {
    container:
      "bg-primary-container text-on-primary-container border-b border-outline-variant/30 shadow-xs",
    badge: "bg-primary/15 text-primary",
    supporting:
      "bg-surface/60 text-on-primary-container border border-outline-variant/40",
    cta: "bg-primary text-on-primary hover:opacity-90",
    control:
      "text-on-primary-container/80 hover:text-on-primary-container hover:bg-on-primary-container/10",
  },
  inverse: {
    container:
      "bg-inverse-surface text-inverse-on-surface border-b border-outline-variant/20 shadow-xs",
    badge: "bg-inverse-on-surface/15 text-inverse-on-surface",
    supporting:
      "bg-inverse-on-surface/15 text-inverse-on-surface border border-inverse-on-surface/20",
    cta: "bg-primary text-on-primary hover:opacity-90",
    control:
      "text-inverse-on-surface/80 hover:text-inverse-on-surface hover:bg-inverse-on-surface/10",
  },
  surface: {
    container:
      "bg-surface-container-high text-on-surface border-b border-outline-variant/40 shadow-xs",
    badge: "bg-primary/15 text-primary",
    supporting:
      "bg-surface-container-highest text-on-surface border border-outline-variant/40",
    cta: "bg-primary text-on-primary hover:opacity-90",
    control:
      "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest",
  },
};

const DEFAULT_BADGE_LABELS: Record<BannerBadgeType, string | null> = {
  special_offer: "Special Offer",
  hot_deal: "Hot Deal",
  new_release: "New Release",
  limited_time: "Limited Time",
  announcement: "Announcement",
  flash_sale: "Flash Sale",
  none: null,
};

function renderBadgeIcon(badgeType: BannerBadgeType): React.ReactNode {
  switch (badgeType) {
    case "hot_deal":
    case "flash_sale":
      return <Icons.Performance size={13} className="shrink-0" />;
    case "new_release":
      return <Icons.Rating size={13} className="shrink-0" />;
    case "limited_time":
      return <Icons.AlertCircle size={13} className="shrink-0" />;
    case "announcement":
      return <Icons.Bell size={13} className="shrink-0" />;
    case "special_offer":
    default:
      return <Icons.Magic size={13} className="shrink-0" />;
  }
}

export interface PromoBarProps {
  onDismiss?: (bannerId?: string) => void;
  className?: string;
  /**
   * Optional explicit banners list (primarily for controlled rendering / testing).
   * When omitted, PromoBar fetches live eligible banners from `/api/v1/banners/active`.
   */
  banners?: PublicBanner[];
}

export const PromoBar: React.FC<PromoBarProps> = ({
  onDismiss,
  className = "",
  banners: controlledBanners,
}) => {
  const {
    banners: fetchedBanners,
    isLoading,
    isError,
  } = useBanners(controlledBanners === undefined);

  const [referenceTimestamp] = useState<number>(() => Date.now());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    getStoredDismissedIds,
  );
  const [activeIndex, setActiveIndex] = useState(0);

  const sourceBanners = controlledBanners ?? fetchedBanners;

  // Enforce eligibility, schedule boundaries, and priority ordering
  const eligibleBanners = useMemo(() => {
    return sourceBanners
      .filter(
        (b) =>
          isBannerEligibleNow(b, referenceTimestamp) && !dismissedIds.has(b.id),
      )
      .sort((a, b) => b.priority - a.priority);
  }, [sourceBanners, dismissedIds, referenceTimestamp]);

  // Do not render anything while loading, on API error, or when no eligible banners exist
  if (
    (controlledBanners === undefined && (isLoading || isError)) ||
    eligibleBanners.length === 0
  ) {
    return null;
  }

  const safeIndex = activeIndex % eligibleBanners.length;
  const activeBanner = eligibleBanners[safeIndex];
  if (!activeBanner) return null;

  const themeStyle =
    APPEARANCE_STYLES[activeBanner.appearance] ?? APPEARANCE_STYLES.primary;
  const resolvedBadgeText =
    activeBanner.badgeType === "none"
      ? null
      : DEFAULT_BADGE_LABELS[activeBanner.badgeType] || null;

  const canShowCta =
    Boolean(activeBanner.showCta) &&
    Boolean(activeBanner.ctaLabel?.trim()) &&
    isSafeBannerUrl(activeBanner.ctaUrl);

  const ctaUrl = activeBanner.ctaUrl?.trim() ?? "";
  const isInternalLink = ctaUrl.startsWith("/");

  const handleDismiss = () => {
    if (!activeBanner.isDismissible) return;
    const nextSet = new Set(dismissedIds);
    nextSet.add(activeBanner.id);
    setDismissedIds(nextSet);
    persistDismissedIds(nextSet);
    setActiveIndex(0);
    onDismiss?.(activeBanner.id);
  };

  const handlePrev = () => {
    setActiveIndex(
      (prev) => (prev - 1 + eligibleBanners.length) % eligibleBanners.length,
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % eligibleBanners.length);
  };

  return (
    <aside
      aria-label="Promotional Offer"
      className={`relative w-full overflow-hidden transition-colors duration-200 ${themeStyle.container} ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium">
        {/* Left: Multi-banner cycle controls when multiple campaigns are active */}
        {eligibleBanners.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous promotional banner"
              className={`p-1 rounded-md transition-colors cursor-pointer ${themeStyle.control}`}
            >
              <Icons.Back size={14} />
            </button>
            <span className="text-[11px] font-semibold opacity-80 tabular-nums">
              {safeIndex + 1}/{eligibleBanners.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next promotional banner"
              className={`p-1 rounded-md transition-colors cursor-pointer ${themeStyle.control}`}
            >
              <Icons.Next size={14} />
            </button>
          </div>
        )}

        {/* Center: Offer details & CTA */}
        <div className="flex-1 min-w-0 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
          {resolvedBadgeText && (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-2xs ${themeStyle.badge}`}
            >
              {renderBadgeIcon(activeBanner.badgeType)}
              <span>{resolvedBadgeText}</span>
            </span>
          )}

          <span className="font-semibold tracking-tight">
            {activeBanner.title}
          </span>

          {activeBanner.description && (
            <>
              <span className="hidden md:inline opacity-65">•</span>
              <span className="hidden md:inline opacity-85 text-xs">
                {activeBanner.description}
              </span>
            </>
          )}

          {activeBanner.supportingText && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-tight ${themeStyle.supporting}`}
            >
              {activeBanner.supportingText}
            </span>
          )}

          {canShowCta &&
            (isInternalLink ? (
              <Link
                to={ctaUrl}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full active:scale-95 font-bold text-xs tracking-tight transition-opacity shadow-xs ${themeStyle.cta}`}
              >
                <span>{activeBanner.ctaLabel}</span>
                <Icons.Next size={13} />
              </Link>
            ) : (
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full active:scale-95 font-bold text-xs tracking-tight transition-opacity shadow-xs ${themeStyle.cta}`}
              >
                <span>{activeBanner.ctaLabel}</span>
                <Icons.ExternalLink size={12} />
              </a>
            ))}
        </div>

        {/* Right: Dismiss button (only rendered if banner is dismissible) */}
        {activeBanner.isDismissible ? (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss offer banner"
            className={`shrink-0 p-1 rounded-md active:scale-95 transition-colors cursor-pointer ${themeStyle.control}`}
          >
            <Icons.Close size={15} />
          </button>
        ) : (
          <div className="w-6 shrink-0" aria-hidden="true" />
        )}
      </div>
    </aside>
  );
};

export default PromoBar;
