import { buildRequestUrl, prepareRequestHeaders } from "./interceptors/requestInterceptor.ts";
import {
    ApiError,
    handleResponseError,
    parseResponseBody,
} from "./interceptors/responseInterceptor.ts";

export interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
    timeoutMs?: number;
    suppressUnauthorizedEvent?: boolean;
}

export { ApiError };

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

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
        params,
        headers,
        timeoutMs = 15000,
        signal: customSignal,
        suppressUnauthorizedEvent,
        ...customConfig
    } = options;

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
        await handleResponseError(response, { suppressUnauthorizedEvent });
    }

    return parseResponseBody<T>(response);
}

export const apiClient = {
    get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "GET" }),
    post: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
    delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "DELETE" }),
};
