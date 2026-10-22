// src/services/v1/bannerService.ts
import { apiClient } from "@/services/api.ts";
import type {
  BannerAppearance,
  BannerBadgeType,
  PublicBanner,
} from "@/types/banner.ts";

interface RawBannerPayload {
  id?: string;
  title?: string;
  description?: string | null;
  supporting_text?: string | null;
  supportingText?: string | null;
  badge_type?: BannerBadgeType;
  badgeType?: BannerBadgeType;
  cta_label?: string | null;
  ctaLabel?: string | null;
  cta_url?: string | null;
  ctaUrl?: string | null;
  show_cta?: boolean;
  showCta?: boolean;
  is_dismissible?: boolean;
  isDismissible?: boolean;
  appearance?: BannerAppearance;
  priority?: number;
  starts_at?: string | null;
  startsAt?: string | null;
  ends_at?: string | null;
  endsAt?: string | null;
  timezone?: string;
  is_active?: boolean;
  isActive?: boolean;
}

interface ActiveBannersResponse {
  success?: boolean;
  data?: RawBannerPayload[];
}

const VALID_BADGE_TYPES = new Set<BannerBadgeType>([
  "special_offer",
  "hot_deal",
  "new_release",
  "limited_time",
  "announcement",
  "flash_sale",
  "none",
]);

const VALID_APPEARANCES = new Set<BannerAppearance>([
  "primary",
  "secondary",
  "tertiary",
  "inverse",
  "surface",
  "accent",
]);

/**
 * Validates that a CTA URL is either a safe internal path starting with "/"
 * (and not "//") or a valid http/https URL.
 */
export function isSafeBannerUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.startsWith("/\\") && !/\s/.test(trimmed);
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Defensive schedule & active-status check ensuring expired, future-scheduled,
 * disabled, or malformed banners are never displayed on the website.
 */
export function isBannerEligibleNow(
  banner: Pick<PublicBanner, "title" | "startsAt" | "endsAt" | "isActive">,
  nowMs: number = Date.now(),
): boolean {
  if (!banner || typeof banner.title !== "string" || !banner.title.trim()) {
    return false;
  }

  if (banner.isActive === false) {
    return false;
  }

  if (banner.startsAt) {
    const startMs = new Date(banner.startsAt).getTime();
    if (Number.isNaN(startMs) || startMs > nowMs) {
      return false;
    }
  }

  if (banner.endsAt) {
    const endMs = new Date(banner.endsAt).getTime();
    if (Number.isNaN(endMs) || endMs <= nowMs) {
      return false;
    }
  }

  return true;
}

/**
 * Normalizes, validates, filters, and priority-orders raw banner records from the API.
 */
export function normalizePublicBanners(
  rawItems: RawBannerPayload[] | undefined | null,
  referenceNowMs: number = Date.now(),
): PublicBanner[] {
  if (!Array.isArray(rawItems)) return [];

  const valid: PublicBanner[] = [];

  for (const raw of rawItems) {
    if (!raw || typeof raw.id !== "string" || !raw.id.trim()) continue;
    if (typeof raw.title !== "string" || !raw.title.trim()) continue;

    const isActive =
      raw.isActive !== undefined
        ? raw.isActive
        : raw.is_active !== undefined
          ? raw.is_active
          : true;

    const rawBadgeType = raw.badgeType ?? raw.badge_type ?? "special_offer";
    const badgeType: BannerBadgeType = VALID_BADGE_TYPES.has(rawBadgeType)
      ? rawBadgeType
      : "special_offer";

    const rawAppearance = raw.appearance ?? "primary";
    const appearance: BannerAppearance = VALID_APPEARANCES.has(rawAppearance)
      ? rawAppearance
      : "primary";

    const ctaLabel = (raw.ctaLabel ?? raw.cta_label ?? null)?.trim() || null;
    const rawCtaUrl = (raw.ctaUrl ?? raw.cta_url ?? null)?.trim() || null;
    const safeCtaUrl = isSafeBannerUrl(rawCtaUrl) ? rawCtaUrl : null;
    const rawShowCta =
      raw.showCta !== undefined
        ? raw.showCta
        : raw.show_cta !== undefined
          ? raw.show_cta
          : true;
    const showCta = Boolean(rawShowCta && ctaLabel && safeCtaUrl);

    const banner: PublicBanner = {
      id: raw.id.trim(),
      title: raw.title.trim(),
      description: (raw.description ?? null)?.trim() || null,
      supportingText:
        (raw.supportingText ?? raw.supporting_text ?? null)?.trim() || null,
      badgeType,
      ctaLabel: showCta ? ctaLabel : null,
      ctaUrl: showCta ? safeCtaUrl : null,
      showCta,
      isDismissible:
        raw.isDismissible !== undefined
          ? Boolean(raw.isDismissible)
          : raw.is_dismissible !== undefined
            ? Boolean(raw.is_dismissible)
            : true,
      appearance,
      priority: Number.isFinite(Number(raw.priority)) ? Number(raw.priority) : 0,
      startsAt: raw.startsAt ?? raw.starts_at ?? null,
      endsAt: raw.endsAt ?? raw.ends_at ?? null,
      timezone: (raw.timezone ?? "UTC").trim() || "UTC",
      isActive,
    };

    if (isBannerEligibleNow(banner, referenceNowMs)) {
      valid.push(banner);
    }
  }

  return valid.sort((a, b) => b.priority - a.priority);
}

class BannerService {
  /**
   * Fetches currently active and schedule-eligible promotional banners from the backend API.
   */
  async getActiveBanners(signal?: AbortSignal): Promise<PublicBanner[]> {
    const response = await apiClient.get<
      ActiveBannersResponse | RawBannerPayload[]
    >("/api/v1/banners/active", { signal });

    const list = Array.isArray(response) ? response : response?.data;
    return normalizePublicBanners(list);
  }
}

export const bannerService = new BannerService();
export default bannerService;

