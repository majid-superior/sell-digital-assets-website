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
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    let url: string;

    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
        url = endpoint;
    } else if (normalizedEndpoint.startsWith("/api/") || normalizedEndpoint === "/api") {
        if (ENV.API_BASE_URL.startsWith("http://") || ENV.API_BASE_URL.startsWith("https://")) {
            try {
                const baseOrigin = new URL(ENV.API_BASE_URL).origin;
                url = `${baseOrigin}${normalizedEndpoint}`;
            } catch {
                url = normalizedEndpoint;
            }
        } else {
            url = normalizedEndpoint;
        }
    } else {
        url = `${ENV.API_BASE_URL}${normalizedEndpoint}`;
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
