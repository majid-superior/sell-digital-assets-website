// src/config/env.ts

/**
 * Normalizes a URL string by stripping trailing slashes.
 */
function normalizeUrl(url?: string): string {
    if (!url) return "";
    return url.replace(/\/+$/, "");
}

/**
 * Global application environment configuration.
 * Single source of truth for base URLs and deployment variables.
 *
 * To change backend URL on deployment (Vercel, Netlify, Render, Railway, AWS):
 * Set the environment variable: VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
 * To set public website base URL:
 * Set the environment variable: VITE_APP_BASE_URL=https://yourdomain.com
 */
const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
const envObj: Record<string, string | undefined> =
    typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env
        : proc?.env ?? {};

function resolveApiBaseUrl(): string {
    const candidate =
        envObj.VITE_API_BASE_URL ||
        envObj.VITE_API_URL ||
        envObj.API_BASE_URL ||
        proc?.env?.VITE_API_BASE_URL ||
        proc?.env?.VITE_API_URL ||
        proc?.env?.API_BASE_URL;

    if (candidate && !candidate.includes("yourdomain.com")) {
        return normalizeUrl(candidate);
    }

    return "/api/v1";
}

function resolveAppBaseUrl(): string {
    const candidate =
        envObj.VITE_APP_BASE_URL ||
        envObj.VITE_SITE_URL ||
        envObj.VITE_PUBLIC_URL ||
        envObj.VITE_FRONTEND_URL ||
        proc?.env?.VITE_APP_BASE_URL ||
        proc?.env?.VITE_SITE_URL ||
        proc?.env?.VITE_PUBLIC_URL ||
        proc?.env?.VITE_FRONTEND_URL;

    if (candidate && !candidate.includes("yourdomain.com")) {
        return normalizeUrl(candidate);
    }

    if (typeof window !== "undefined" && window.location?.origin) {
        return normalizeUrl(window.location.origin);
    }

    return "http://localhost:5173";
}

const resolvedAppBaseUrl = resolveAppBaseUrl();

export const ENV = {
    /**
     * Primary Backend API Base URL.
     * In development: defaults to "/api/v1" or value of VITE_API_BASE_URL/VITE_API_URL in .env
     * In production: set VITE_API_BASE_URL or VITE_API_URL in your hosting platform dashboard
     */
    API_BASE_URL: resolveApiBaseUrl(),

    /**
     * Public Frontend Application Base URL (with protocol, no trailing slash).
     * Resolved dynamically from VITE_APP_BASE_URL / VITE_SITE_URL or window.location.origin.
     */
    APP_BASE_URL: resolvedAppBaseUrl,

    /**
     * Compact host/path prefix without protocol (e.g. "localhost:5173" or "yourdomain.com").
     */
    APP_HOST: resolvedAppBaseUrl.replace(/^https?:\/\//i, ""),

    /**
     * Application environment flags.
     */
    IS_DEV: Boolean(envObj?.DEV ?? proc?.env?.NODE_ENV !== "production"),
    IS_PROD: Boolean(envObj?.PROD ?? proc?.env?.NODE_ENV === "production"),
    MODE: String(envObj?.MODE ?? proc?.env?.NODE_ENV ?? "development"),
} as const;

export default ENV;
