// src/services/telemetry/telemetryClient.ts
import { ENV } from "@/config/env.ts";
import { getAuthToken } from "@/services/interceptors/requestInterceptor.ts";
import {
  getVisitorId,
  getSessionId,
  getDeviceType,
  getBrowserInfo,
  getTelemetryConsent,
  type ConsentStatus,
} from "./telemetryStorage.ts";
import type { TelemetryEvent, TelemetryBatchPayload } from "./telemetryTypes.ts";

const BATCH_FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 15;

class TelemetryClient {
  private queue: TelemetryEvent[] = [];
  private flushTimer: number | null = null;
  private isFlushing = false;
  private isInitialized = false;

  public init(): void {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    // Start background batch flush timer
    this.flushTimer = window.setInterval(() => {
      void this.flush();
    }, BATCH_FLUSH_INTERVAL_MS);

    // Reliable flush on tab visibility change or unload
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flushImmediateWithBeacon();
      }
    });

    window.addEventListener("beforeunload", () => {
      this.flushImmediateWithBeacon();
    });

    // Listen to user consent choices in real-time
    window.addEventListener("telemetry:consent_changed", ((
      e: CustomEvent<ConsentStatus>
    ) => {
      if (e.detail === "denied") {
        this.queue = [];
      }
    }) as EventListener);
  }

  public enqueue(event: Omit<TelemetryEvent, "timestamp">): void {
    if (getTelemetryConsent() === "denied") {
      return;
    }

    const fullEvent: TelemetryEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    this.queue.push(fullEvent);

    if (this.queue.length >= MAX_BATCH_SIZE) {
      void this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (getTelemetryConsent() === "denied") {
      this.queue = [];
      return;
    }

    if (this.queue.length === 0 || this.isFlushing || typeof window === "undefined") {
      return;
    }

    this.isFlushing = true;
    const eventsToSend = this.queue.splice(0, MAX_BATCH_SIZE);

    try {
      const payload = this.buildPayload(eventsToSend);
      const url = this.getEndpointUrl();
      const token = getAuthToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        keepalive: true,
      });
    } catch {
      // Re-queue events on transient network failure if buffer is not overloaded
      if (this.queue.length < 50) {
        this.queue.unshift(...eventsToSend);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  private flushImmediateWithBeacon(): void {
    if (this.queue.length === 0 || typeof window === "undefined") return;

    const eventsToSend = this.queue.splice(0, this.queue.length);
    const payload = this.buildPayload(eventsToSend);
    const url = this.getEndpointUrl();

    const jsonString = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([jsonString], { type: "application/json" });
      const success = navigator.sendBeacon(url, blob);
      if (!success) {
        // Fallback to synchronous keepalive fetch if sendBeacon buffer is rejected
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: jsonString,
          keepalive: true,
        }).catch(() => {});
      }
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonString,
        keepalive: true,
      }).catch(() => {});
    }
  }

  private buildPayload(events: TelemetryEvent[]): TelemetryBatchPayload {
    const { browser, operatingSystem } = getBrowserInfo();

    return {
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      deviceType: getDeviceType(),
      browser,
      operatingSystem,
      events,
    };
  }

  private getEndpointUrl(): string {
    const base = (ENV.API_BASE_URL || "/api/v1").replace(/\/+$/, "");
    return `${base}/analytics/events/batch`;
  }

  public destroy(): void {
    if (this.flushTimer !== null) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushImmediateWithBeacon();
    this.isInitialized = false;
  }
}

export const telemetryClient = new TelemetryClient();
