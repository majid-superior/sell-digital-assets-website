// src/hooks/usePageDwellTracker.ts
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTelemetry } from "./useTelemetry.ts";
import type { TelemetryEntityType } from "@/services/telemetry/telemetryTypes.ts";

export interface PageDwellOptions {
  entityType?: TelemetryEntityType;
  entityId?: string;
  heartbeatIntervalSeconds?: number;
}

/**
 * Hook to track active, focused dwell time and scroll depth on a page.
 * Automatically pauses when the tab is blurred or hidden.
 */
export function usePageDwellTracker(options?: PageDwellOptions) {
  const { trackDwell } = useTelemetry();
  const location = useLocation();

  const currentPath = location.pathname + location.search;
  const activeSecondsRef = useRef(0);
  const isTabVisibleRef = useRef(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true,
  );
  const maxScrollDepthRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // 1. Scroll depth tracking
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;
    const calculateScrollDepth = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight > 0) {
        const depth = Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
        if (depth > maxScrollDepthRef.current) {
          maxScrollDepthRef.current = depth;
        }
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(calculateScrollDepth);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    calculateScrollDepth();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [currentPath]);

  // 2. Active seconds timer & visibility awareness
  useEffect(() => {
    if (typeof window === "undefined") return;

    const intervalMs = 1000;
    const heartbeatThreshold = (options?.heartbeatIntervalSeconds || 30);

    const onVisibilityChange = () => {
      isTabVisibleRef.current = document.visibilityState === "visible";
    };

    const onFocus = () => {
      isTabVisibleRef.current = true;
    };

    const onBlur = () => {
      isTabVisibleRef.current = false;
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    // Active seconds counter ticker
    timerRef.current = window.setInterval(() => {
      if (isTabVisibleRef.current) {
        activeSecondsRef.current += 1;

        // Periodic heartbeat at threshold intervals
        if (
          activeSecondsRef.current > 0 &&
          activeSecondsRef.current % heartbeatThreshold === 0
        ) {
          trackDwell(activeSecondsRef.current, currentPath, {
            entityType: options?.entityType,
            entityId: options?.entityId,
            scrollDepth: maxScrollDepthRef.current,
          });
        }
      }
    }, intervalMs);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);

      // Final dwell transmission upon leaving the page
      if (activeSecondsRef.current > 0) {
        trackDwell(activeSecondsRef.current, currentPath, {
          entityType: options?.entityType,
          entityId: options?.entityId,
          scrollDepth: maxScrollDepthRef.current,
        });
      }

      activeSecondsRef.current = 0;
      maxScrollDepthRef.current = 0;
    };
  }, [currentPath, options?.entityType, options?.entityId, options?.heartbeatIntervalSeconds, trackDwell]);
}

