// src/services/telemetry/telemetryStorage.ts

const VISITOR_ID_KEY = "sda_vid";
const SESSION_ID_KEY = "sda_sid";
const SESSION_LAST_ACTIVE_KEY = "sda_sla";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes of inactivity
export const CONSENT_STORAGE_KEY = "sda_telemetry_consent";

export type ConsentStatus = "granted" | "denied" | "pending";

/**
 * Retrieves the current cookie & telemetry consent status.
 */
export function getTelemetryConsent(): ConsentStatus {
  if (typeof window === "undefined") return "granted";
  try {
    const val = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (val === "granted" || val === "denied") return val;
    return "pending";
  } catch {
    return "pending";
  }
}

/**
 * Stores user choice for telemetry consent and broadcasts event.
 */
export function setTelemetryConsent(status: "granted" | "denied"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, status);
    window.dispatchEvent(
      new CustomEvent<ConsentStatus>("telemetry:consent_changed", {
        detail: status,
      })
    );
  } catch {
    // Ignore browser storage write errors
  }
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Returns or initializes a persistent visitor ID (UUIDv4) stored across sessions.
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "server-visitor";
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = generateUUID();
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return generateUUID();
  }
}

/**
 * Returns or refreshes a session ID. Sessions expire after 30 minutes of inactivity.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";
  try {
    const now = Date.now();
    const lastActiveStr = sessionStorage.getItem(SESSION_LAST_ACTIVE_KEY);
    const existingSid = sessionStorage.getItem(SESSION_ID_KEY);

    if (existingSid && lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      if (now - lastActive < SESSION_TIMEOUT_MS) {
        sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, String(now));
        return existingSid;
      }
    }

    // New or expired session
    const newSid = generateUUID();
    sessionStorage.setItem(SESSION_ID_KEY, newSid);
    sessionStorage.setItem(SESSION_LAST_ACTIVE_KEY, String(now));
    return newSid;
  } catch {
    return generateUUID();
  }
}

/**
 * Detects whether client device is mobile, tablet, or desktop.
 */
export function getDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof window === "undefined" || !navigator.userAgent) return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return "mobile";
  }
  if (window.innerWidth <= 768) {
    return "mobile";
  }
  if (window.innerWidth <= 1024) {
    return "tablet";
  }
  return "desktop";
}

/**
 * Extracts basic browser name and operating system without invasive fingerprinting.
 */
export function getBrowserInfo(): { browser: string; operatingSystem: string } {
  if (typeof window === "undefined" || !navigator.userAgent) {
    return { browser: "Unknown", operatingSystem: "Unknown" };
  }

  const ua = navigator.userAgent;
  let browser = "Other";
  let operatingSystem = "Other";

  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("SamsungBrowser")) browser = "Samsung Browser";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  if (ua.includes("Win")) operatingSystem = "Windows";
  else if (ua.includes("Mac")) operatingSystem = "macOS";
  else if (ua.includes("Linux")) operatingSystem = "Linux";
  else if (ua.includes("Android")) operatingSystem = "Android";
  else if (ua.includes("like Mac")) operatingSystem = "iOS";

  return { browser, operatingSystem };
}

