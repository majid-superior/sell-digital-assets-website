import { buildRequestUrl, prepareRequestHeaders, getRefreshToken } from "./interceptors/requestInterceptor.ts";
import {
    ApiError,
    handleResponseError,
    parseResponseBody,
} from "./interceptors/responseInterceptor.ts";

export interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
    timeoutMs?: number;
}

export { ApiError };

let refreshInProgressPromise: Promise<string | null> | null = null;

async function attemptSilentRefresh(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
        const refreshUrl = buildRequestUrl("/api/v1/auth/refresh");
        const res = await fetch(refreshUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
            return null;
        }

        const data = (await res.json()) as {
            token?: string;
            refreshToken?: string;
            tokens?: { accessToken?: string; refreshToken?: string };
            user?: unknown;
        };
        const newToken = data?.token || data?.tokens?.accessToken;
        const newRefreshToken = data?.refreshToken || data?.tokens?.refreshToken || refreshToken;

        if (newToken) {
            const storage =
                typeof window !== "undefined" &&
                (localStorage.getItem("auth_token") || localStorage.getItem("auth_refresh_token"))
                    ? localStorage
                    : sessionStorage;
            storage.setItem("auth_token", newToken);
            storage.setItem("auth_refresh_token", newRefreshToken);
            if (data.user) {
                storage.setItem("auth_user", JSON.stringify(data.user));
            }
            return newToken;
        }
        return null;
    } catch {
        return null;
    }
}

export class NetworkError extends Error {
    constructor(
        message = "Unable to connect to the server. Please check your internet connection.",
        options?: { cause?: unknown }
    ) {
        super(message, options);
        this.name = "NetworkError";
    }
}

export class TimeoutError extends Error {
    constructor(
        message = "The server is taking too long to respond. Request timed out.",
        options?: { cause?: unknown }
    ) {
        super(message, options);
        this.name = "TimeoutError";
    }
}

async function request<T>(endpoint: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
    const { params, headers, timeoutMs = 15000, signal: customSignal, ...customConfig } = options;

    const url = buildRequestUrl(endpoint, params);
    const requestHeaders = prepareRequestHeaders(headers);

    // Timeout management via AbortController
    const controller = new AbortController();
    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
        isTimedOut = true;
        controller.abort(new TimeoutError("Server took too long to respond. Request timed out."));
    }, timeoutMs);

    // Forward abort if an external signal was passed
    if (customSignal) {
        if (customSignal.aborted) {
            clearTimeout(timeoutId);
            controller.abort(customSignal.reason);
        } else {
            customSignal.addEventListener("abort", () => {
                clearTimeout(timeoutId);
                controller.abort(customSignal.reason);
            });
        }
    }

    const config: RequestInit = {
        credentials: "same-origin",
        ...customConfig,
        signal: controller.signal,
        headers: requestHeaders,
    };

    let response: Response;
    try {
        response = await fetch(url, config);
    } catch (error: unknown) {
        if (isTimedOut || (error instanceof DOMException && error.name === "TimeoutError")) {
            throw new TimeoutError("The server is taking too long to respond. Request timed out.", { cause: error });
        }

        if (error instanceof DOMException && error.name === "AbortError") {
            if (isTimedOut) {
                throw new TimeoutError("The server is taking too long to respond. Request timed out.", { cause: error });
            }
            throw new Error("Request was cancelled.", { cause: error });
        }

        if (error instanceof TypeError) {
            throw new NetworkError("Unable to connect to the server. Please verify your internet connection or server availability.", { cause: error });
        }

        if (error instanceof Error) {
            throw error;
        }

        throw new NetworkError("An unknown network error occurred.", { cause: error });
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        const isAuthEndpoint =
            endpoint.includes("/auth/signin") ||
            endpoint.includes("/auth/signup") ||
            endpoint.includes("/auth/refresh");

        if (response.status === 401 && !isAuthEndpoint && !isRetry) {
            if (!refreshInProgressPromise) {
                refreshInProgressPromise = attemptSilentRefresh().finally(() => {
                    refreshInProgressPromise = null;
                });
            }
            const renewedToken = await refreshInProgressPromise;
            if (renewedToken) {
                return request<T>(endpoint, options, true);
            }
        }

        await handleResponseError(response, endpoint);
    }

    return parseResponseBody<T>(response);
}

export const apiClient = {
    get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "GET" }),
    post: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
    patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "DELETE" }),
};
