// src/hooks/useSectionObserver.ts
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTelemetry } from "./useTelemetry.ts";

export interface SectionObserverOptions {
  sectionName: string;
  entityId?: string;
  minDwellSeconds?: number;
}

/**
 * Hook to track how long a user focuses on a specific section of a page.
 * Uses IntersectionObserver to detect when >= 50% of the section is visible.
 */
export function useSectionObserver<T extends HTMLElement = HTMLElement>(
  options: SectionObserverOptions,
) {
  const { trackDwell } = useTelemetry();
  const location = useLocation();
  const elementRef = useRef<T | null>(null);

  const currentPath = location.pathname + location.search;
  const isIntersectingRef = useRef(false);
  const activeSecondsRef = useRef(0);
  const isTabVisibleRef = useRef(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true,
  );
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const onVisibilityChange = () => {
      isTabVisibleRef.current = document.visibilityState === "visible";
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    timerRef.current = window.setInterval(() => {
      if (isIntersectingRef.current && isTabVisibleRef.current) {
        activeSecondsRef.current += 1;
      }
    }, 1000);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        const isNowVisible = entry.isIntersecting && entry.intersectionRatio >= 0.5;

        // Transition from visible -> not visible: send accumulated dwell
        if (isIntersectingRef.current && !isNowVisible) {
          const minSeconds = options.minDwellSeconds || 2;
          if (activeSecondsRef.current >= minSeconds) {
            trackDwell(activeSecondsRef.current, currentPath, {
              sectionName: options.sectionName,
              entityId: options.entityId,
            });
          }
          activeSecondsRef.current = 0;
        }

        isIntersectingRef.current = isNowVisible;
      },
      {
        threshold: [0, 0.5, 1.0],
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);

      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Final transmission on section unmount
      const minSeconds = options.minDwellSeconds || 2;
      if (activeSecondsRef.current >= minSeconds) {
        trackDwell(activeSecondsRef.current, currentPath, {
          sectionName: options.sectionName,
          entityId: options.entityId,
        });
      }

      activeSecondsRef.current = 0;
      isIntersectingRef.current = false;
    };
  }, [currentPath, options.sectionName, options.entityId, options.minDwellSeconds, trackDwell]);

  return elementRef;
}

