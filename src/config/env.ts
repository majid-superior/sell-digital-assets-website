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

function resolveApiBaseUrl(): string {
    const candidate =
        (envObj?.VITE_API_BASE_URL as string | undefined) ||
        (envObj?.VITE_API_URL as string | undefined) ||
        (envObj?.API_BASE_URL as string | undefined) ||
        (proc?.env?.VITE_API_BASE_URL as string | undefined) ||
        (proc?.env?.VITE_API_URL as string | undefined) ||
        (proc?.env?.API_BASE_URL as string | undefined);

    if (candidate && !candidate.includes("yourdomain.com")) {
        return normalizeUrl(candidate);
    }

    return "/api/v1";
}

export const ENV = {
    /**
     * Primary Backend API Base URL.
     * In development: defaults to "/api/v1" or value of VITE_API_BASE_URL/VITE_API_URL in .env
     * In production: set VITE_API_BASE_URL or VITE_API_URL in your hosting platform dashboard
     */
    API_BASE_URL: resolveApiBaseUrl(),

    /**
     * Application environment flags.
     */
    IS_DEV: Boolean(envObj?.DEV ?? proc?.env?.NODE_ENV !== "production"),
    IS_PROD: Boolean(envObj?.PROD ?? proc?.env?.NODE_ENV === "production"),
    MODE: String(envObj?.MODE ?? proc?.env?.NODE_ENV ?? "development"),
} as const;

export default ENV;
