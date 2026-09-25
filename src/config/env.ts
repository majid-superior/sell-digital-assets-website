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
export const ENV = {
    /**
     * Primary Backend API Base URL.
     * In development: defaults to "/api/v1" or value of VITE_API_BASE_URL in .env
     * In production: set VITE_API_BASE_URL in your hosting platform dashboard
     */
    API_BASE_URL: normalizeUrl(import.meta.env.VITE_API_BASE_URL) || "/api/v1",

    /**
     * Application environment flags.
     */
    IS_DEV: import.meta.env.DEV,
    IS_PROD: import.meta.env.PROD,
    MODE: import.meta.env.MODE,
} as const;

export default ENV;
