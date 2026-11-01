// src/provider/TelemetryProvider.tsx
import React, { useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { TelemetryContext } from "@/context/TelemetryContext.ts";
import { telemetryClient } from "@/services/telemetry/telemetryClient.ts";
import { getVisitorId, getSessionId } from "@/services/telemetry/telemetryStorage.ts";
import type {
  TelemetryContextValue,
  TelemetryEvent,
  TelemetryEntityType,
} from "@/services/telemetry/telemetryTypes.ts";

export interface TelemetryProviderProps {
  children: React.ReactNode;
}

export const TelemetryProvider: React.FC<TelemetryProviderProps> = ({ children }) => {
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  // Initialize client lifecycle listeners once on mount
  useEffect(() => {
    telemetryClient.init();
    return () => {
      telemetryClient.destroy();
    };
  }, []);

  // Automatic Page View tracking on React Router navigation
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (lastTrackedPath.current === currentPath) return;
    lastTrackedPath.current = currentPath;

    telemetryClient.enqueue({
      eventType: "page_view",
      path: currentPath,
      entityType: "page",
    });
  }, [location.pathname, location.search]);

  const trackEvent = useCallback((event: Omit<TelemetryEvent, "timestamp">) => {
    telemetryClient.enqueue(event);
  }, []);

  const trackPageView = useCallback(
    (path: string, metadata?: Record<string, unknown>) => {
      telemetryClient.enqueue({
        eventType: "page_view",
        path,
        entityType: "page",
        metadata,
      });
    },
    [],
  );

  const trackDwell = useCallback(
    (
      dwellSeconds: number,
      path: string,
      options?: {
        entityType?: TelemetryEntityType;
        entityId?: string;
        sectionName?: string;
        scrollDepth?: number;
      },
    ) => {
      telemetryClient.enqueue({
        eventType: "dwell_heartbeat",
        path,
        dwellSeconds,
        entityType: options?.entityType,
        entityId: options?.entityId,
        sectionName: options?.sectionName,
        scrollDepth: options?.scrollDepth || 0,
      });
    },
    [],
  );

  const trackSearch = useCallback(
    (query: string, resultsCount: number, categoryId?: number) => {
      telemetryClient.enqueue({
        eventType: "search_query",
        path: "/explore",
        entityType: "category",
        entityId: categoryId ? String(categoryId) : undefined,
        metadata: {
          queryText: query,
          resultsCount,
        },
      });
    },
    [],
  );

  const trackAddToCart = useCallback(
    (assetId: string, assetTitle?: string, price?: number) => {
      telemetryClient.enqueue({
        eventType: "add_to_cart",
        path: `/asset/${assetId}`,
        entityType: "asset",
        entityId: assetId,
        metadata: {
          assetTitle,
          price,
        },
      });
    },
    [],
  );

  const trackCreatorView = useCallback((sellerId: string, sellerName?: string) => {
    telemetryClient.enqueue({
      eventType: "seller_store_view",
      path: `/creator/${sellerId}`,
      entityType: "seller_profile",
      entityId: sellerId,
      metadata: {
        sellerName,
      },
    });
  }, []);

  const visitorId = useMemo(() => getVisitorId(), []);
  const sessionId = useMemo(() => getSessionId(), []);

  const contextValue: TelemetryContextValue = useMemo(
    () => ({
      visitorId,
      sessionId,
      trackEvent,
      trackPageView,
      trackDwell,
      trackSearch,
      trackAddToCart,
      trackCreatorView,
    }),
    [
      visitorId,
      sessionId,
      trackEvent,
      trackPageView,
      trackDwell,
      trackSearch,
      trackAddToCart,
      trackCreatorView,
    ],
  );

  return (
    <TelemetryContext.Provider value={contextValue}>
      {children}
    </TelemetryContext.Provider>
  );
};

