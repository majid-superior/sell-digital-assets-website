import { apiClient, ApiError } from "../api.ts";

export interface OrganizationInfo {
  name: string;
  shortName: string;
  title: string;
  tagline: string;
  description: string;
  address: string;
  website: string;
  supportEmail: string;
  defaultCurrency: string;
  currencySymbol: string;
  feePercentage: number;
  minPayout: number;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
}

export interface BackendOrganizationPayload {
  id?: number;
  organization_name?: string;
  legal_name?: string;
  tagline?: string | null;
  description?: string | null;
  logo_url?: string | null;
  logo_dark_url?: string | null;
  favicon_url?: string | null;
  cover_banner_url?: string | null;
  support_email?: string;
  contact_email?: string | null;
  support_phone?: string | null;
  support_url?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  tax_id?: string | null;
  default_currency?: string;
  currency?: {
    code: string;
    name: string;
    symbol: string;
  } | null;
  currency_name?: string | null;
  currency_symbol?: string | null;
  platform_fee_percent?: string | number;
  payout_minimum?: string | number;
  metadata?: {
    links?: {
      website?: string;
    };
  } | null;
}

export class OrganizationServiceError extends ApiError {}

export const defaultOrganization: OrganizationInfo = {
  name: "AssetDrop",
  shortName: "AssetDrop",
  title: "AssetDrop",
  tagline: "System Status & Observability Dashboard",
  description: "Enterprise-grade digital assets marketplace and license distribution REST API platform.",
  address: "Ring Road, Lahore, Punjab 000000, Pakistan",
  website: "https://selldigitalassets.com",
  supportEmail: "support@selldigitalassets.com",
  defaultCurrency: "PKR",
  currencySymbol: "₨",
  feePercentage: 5.0,
  minPayout: 25000.0,
  logoUrl: "/logo.png",
  logoDarkUrl: "/logo-dark.png",
  faviconUrl: "/favicon.ico",
};

export const STORAGE_KEY_ORGANIZATION_TITLE = "organization_title";
export const STORAGE_KEY_ORGANIZATION_FAVICON = "organization_favicon";
export const STORAGE_KEY_ORGANIZATION_DATA = "organization_data";

let cachedOrganization: OrganizationInfo | null = null;

export function updateDocumentTitle(title?: string | null): void {
  if (typeof document === "undefined") return;
  const orgTitle = title?.trim() || defaultOrganization.title;
  document.title = `${orgTitle} | Marketplace`;
}

export function updateFavicon(faviconUrl?: string | null): void {
  if (typeof document === "undefined" || !faviconUrl) return;
  const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (link) {
    link.href = faviconUrl;
  }
}

export function applyOrganizationMetadata(info: OrganizationInfo | null): void {
  if (!info) return;
  const title = info.title || info.shortName || info.name || defaultOrganization.title;
  updateDocumentTitle(title);
  try {
    localStorage.setItem(STORAGE_KEY_ORGANIZATION_TITLE, title);
    if (info.faviconUrl) {
      localStorage.setItem(STORAGE_KEY_ORGANIZATION_FAVICON, info.faviconUrl);
      updateFavicon(info.faviconUrl);
    }
    localStorage.setItem(STORAGE_KEY_ORGANIZATION_DATA, JSON.stringify(info));
  } catch {
    // Ignore storage quota errors
  }
}

function mapBackendToOrganizationInfo(b: BackendOrganizationPayload): OrganizationInfo {
  const orgName = b.organization_name || b.legal_name || defaultOrganization.name;
  const addressParts = [b.address_line1, b.city, b.state, b.country].filter(Boolean);
  const address = addressParts.join(", ") || b.address_line1 || "";
  const website = b.metadata?.links?.website || b.support_url || "";
  const defaultCurrency = b.default_currency || "PKR";
  const currencySymbol = b.currency?.symbol || b.currency_symbol || (defaultCurrency === "USD" ? "$" : "₨");

  return {
    name: b.legal_name || orgName,
    shortName: orgName,
    title: orgName,
    tagline: b.tagline || defaultOrganization.tagline,
    description: b.description || defaultOrganization.description,
    address: address || defaultOrganization.address,
    website: website || defaultOrganization.website,
    supportEmail: b.support_email || b.contact_email || defaultOrganization.supportEmail,
    defaultCurrency,
    currencySymbol,
    feePercentage: Number(b.platform_fee_percent) || defaultOrganization.feePercentage,
    minPayout: Number(b.payout_minimum) || defaultOrganization.minPayout,
    logoUrl: b.logo_url || defaultOrganization.logoUrl,
    logoDarkUrl: b.logo_dark_url || defaultOrganization.logoDarkUrl,
    faviconUrl: b.favicon_url || defaultOrganization.faviconUrl,
  };
}

export const organizationService = {
  /**
   * Fast bootstrap called at application launch (main.tsx).
   * Reads from localStorage cache if available for instant 0ms title paint, then silently syncs with PostgreSQL.
   */
  initOrganizationBootstrap(): void {
    if (typeof window === "undefined") return;

    try {
      const cachedTitle = localStorage.getItem(STORAGE_KEY_ORGANIZATION_TITLE);
      if (cachedTitle) {
        updateDocumentTitle(cachedTitle);
      }
      const cachedFavicon = localStorage.getItem(STORAGE_KEY_ORGANIZATION_FAVICON);
      if (cachedFavicon) {
        updateFavicon(cachedFavicon);
      }
      const cachedData = localStorage.getItem(STORAGE_KEY_ORGANIZATION_DATA);
      if (cachedData) {
        cachedOrganization = JSON.parse(cachedData) as OrganizationInfo;
      }
    } catch {
      // Ignore storage parse errors
    }

    // Silent background SWR sync with PostgreSQL database
    this.getOrganization({ silent: true }).catch(() => {
      // Handled silently
    });
  },

  /**
   * Returns current in-memory cached organization details if already fetched.
   */
  getCachedOrganization(): OrganizationInfo | null {
    if (cachedOrganization) return cachedOrganization;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_ORGANIZATION_DATA);
        if (stored) {
          cachedOrganization = JSON.parse(stored) as OrganizationInfo;
          return cachedOrganization;
        }
      } catch {
        // Ignore parsing errors
      }
    }
    return defaultOrganization;
  },

  /**
   * Sets or updates in-memory cached organization data.
   */
  setCachedOrganization(info: OrganizationInfo | null): void {
    cachedOrganization = info;
    if (info) {
      applyOrganizationMetadata(info);
    }
  },

  /**
   * Clears the in-memory cache.
   */
  clearCache(): void {
    cachedOrganization = null;
  },

  /**
   * Fetches real organization metadata directly from the backend server.
   */
  async getOrganization(options?: {
    silent?: boolean;
    signal?: AbortSignal;
  }): Promise<OrganizationInfo> {
    try {
      const raw = await apiClient.get<BackendOrganizationPayload>(
        "/api/organizations",
        {
          signal: options?.signal,
        },
      );

      const mapped = mapBackendToOrganizationInfo(raw);
      cachedOrganization = mapped;
      applyOrganizationMetadata(mapped);
      return mapped;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        throw err;
      }
      if (cachedOrganization) return cachedOrganization;
      return defaultOrganization;
    }
  },
};

export default organizationService;

