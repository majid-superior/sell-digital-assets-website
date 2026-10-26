// src/services/interceptors/requestInterceptor.ts
import { ENV } from "../../config/env.ts";

export interface RequestInterceptorOptions {
    params?: Record<string, string | number | boolean>;
    headers?: HeadersInit;
}

/**
 * Retrieve the active auth token from persistent or session storage.
 */
export function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
}

/**
 * Retrieve the active refresh token from persistent or session storage.
 */
export function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_refresh_token") || sessionStorage.getItem("auth_refresh_token");
}

/**
 * Build a fully-qualified URL with query parameter serialization.
 */
export function buildRequestUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean>
): string {
    let url: string;

    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
        url = endpoint;
    } else {
        const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
        const rawBase = (ENV.API_BASE_URL || "/api/v1").replace(/\/+$/, "");

        if (rawBase.startsWith("http://") || rawBase.startsWith("https://")) {
            try {
                const parsed = new URL(rawBase);
                const basePath = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");

                if (basePath.endsWith("/api/v1") && cleanEndpoint.startsWith("/api/v1/")) {
                    url = `${parsed.origin}${basePath}${cleanEndpoint.replace(/^\/api\/v1/, "")}`;
                } else if (!basePath && !cleanEndpoint.startsWith("/api/")) {
                    url = `${parsed.origin}/api/v1${cleanEndpoint}`;
                } else {
                    url = `${parsed.origin}${basePath}${cleanEndpoint}`;
                }
            } catch {
                url = `${rawBase}${cleanEndpoint}`;
            }
        } else {
            const baseClean = rawBase.startsWith("/") ? rawBase : `/${rawBase}`;
            if (baseClean === "/api/v1" && cleanEndpoint.startsWith("/api/v1/")) {
                url = cleanEndpoint;
            } else if (cleanEndpoint.startsWith(baseClean)) {
                url = cleanEndpoint;
            } else {
                url = `${baseClean}${cleanEndpoint}`;
            }
        }
    }

    if (params && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (queryString) {
            url += `?${queryString}`;
        }
    }

    return url;
}

/**
 * Prepare request headers with authentication token and JSON content standards.
 */
export function prepareRequestHeaders(customHeaders?: HeadersInit): Record<string, string> {
    const token = getAuthToken();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (customHeaders) {
        if (customHeaders instanceof Headers) {
            customHeaders.forEach((val, key) => {
                headers[key] = val;
            });
        } else if (Array.isArray(customHeaders)) {
            customHeaders.forEach(([key, val]) => {
                headers[key] = val;
            });
        } else {
            Object.assign(headers, customHeaders);
        }
    }

    return headers;
}

