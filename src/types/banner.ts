// src/types/banner.ts

export type BannerBadgeType =
  | "special_offer"
  | "hot_deal"
  | "new_release"
  | "limited_time"
  | "announcement"
  | "flash_sale"
  | "none";

export type BannerAppearance =
  | "primary"
  | "secondary"
  | "tertiary"
  | "inverse"
  | "surface"
  | "accent";

export interface PublicBanner {
  id: string;
  title: string;
  description: string | null;
  supportingText: string | null;
  badgeType: BannerBadgeType;
  ctaLabel: string | null;
  ctaUrl: string | null;
  showCta: boolean;
  isDismissible: boolean;
  appearance: BannerAppearance;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  isActive?: boolean;
}

