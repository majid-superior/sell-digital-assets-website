// src/services/telemetry/telemetryTypes.ts

export type TelemetryEventType =
  | "page_view"
  | "dwell_heartbeat"
  | "section_view"
  | "asset_view"
  | "search_query"
  | "add_to_cart"
  | "seller_store_view"
  | "checkout_step";

export type TelemetryEntityType =
  | "asset"
  | "category"
  | "seller_profile"
  | "checkout"
  | "page";

export interface TelemetryEvent {
  eventType: TelemetryEventType;
  path: string;
  entityType?: TelemetryEntityType;
  entityId?: string;
  sectionName?: string;
  dwellSeconds?: number;
  scrollDepth?: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

export interface TelemetryBatchPayload {
  visitorId: string;
  sessionId: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser?: string;
  operatingSystem?: string;
  events: TelemetryEvent[];
}

export interface TelemetryContextValue {
  visitorId: string;
  sessionId: string;
  trackEvent: (event: Omit<TelemetryEvent, "timestamp">) => void;
  trackPageView: (path: string, metadata?: Record<string, unknown>) => void;
  trackDwell: (
    dwellSeconds: number,
    path: string,
    options?: {
      entityType?: TelemetryEntityType;
      entityId?: string;
      sectionName?: string;
      scrollDepth?: number;
    },
  ) => void;
  trackSearch: (query: string, resultsCount: number, categoryId?: number) => void;
  trackAddToCart: (assetId: string, assetTitle?: string, price?: number) => void;
  trackCreatorView: (sellerId: string, sellerName?: string) => void;
}

