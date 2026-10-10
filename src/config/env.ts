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
 */
const proc = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process;
const envObj =
    typeof import.meta !== "undefined" && import.meta.env
        ? import.meta.env
        : proc?.env ?? {};

export const ENV = {
    /**
     * Primary Backend API Base URL.
     * In development: defaults to "/api/v1" or value of VITE_API_BASE_URL in .env
     * In production: set VITE_API_BASE_URL in your hosting platform dashboard
     */
    API_BASE_URL: normalizeUrl(envObj?.VITE_API_BASE_URL) || "/api/v1",

    /**
     * Application environment flags.
     */
    IS_DEV: Boolean(envObj?.DEV ?? proc?.env?.NODE_ENV !== "production"),
    IS_PROD: Boolean(envObj?.PROD ?? proc?.env?.NODE_ENV === "production"),
    MODE: String(envObj?.MODE ?? proc?.env?.NODE_ENV ?? "development"),
} as const;

export default ENV;
