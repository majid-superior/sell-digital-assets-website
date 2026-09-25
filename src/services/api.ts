import { ENV } from "@/config/env.ts";

export interface RequestOptions extends RequestInit {
    params?: Record<string, string | number | boolean>;
    timeoutMs?: number;
}

export class ApiError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly data: unknown;

    constructor(
        status: number,
        statusText: string,
        data: unknown,
        options?: { cause?: unknown }
    ) {
        super(`API Error ${status}: ${statusText}`, options);
        this.name = "ApiError";
        this.status = status;
        this.statusText = statusText;
        this.data = data;
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

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, timeoutMs = 15000, signal: customSignal, ...customConfig } = options;

    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    let url = `${ENV.API_BASE_URL}${normalizedEndpoint}`;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            searchParams.append(key, String(value));
        });
        url += `?${searchParams.toString()}`;
    }

    const token = localStorage.getItem("auth_token");
    const defaultHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

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
        ...customConfig,
        signal: controller.signal,
        headers: {
            ...defaultHeaders,
            ...headers,
        },
    };

    let response: Response;
    try {
        response = await fetch(url, config);
    } catch (error: unknown) {
        clearTimeout(timeoutId);

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
        let errorData: unknown;
        try {
            errorData = (await response.json()) as unknown;
        } catch {
            try {
                errorData = await response.text();
            } catch {
                errorData = null;
            }
        }
        if (response.status === 401) {
            // Trigger authentication expired event
            window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        }
        throw new ApiError(response.status, response.statusText, errorData);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as unknown as T;
    }

    try {
        return (await response.json()) as T;
    } catch (parseError: unknown) {
        throw new ApiError(
            response.status,
            "Invalid JSON response",
            "The server returned an unparseable response.",
            { cause: parseError }
        );
    }
}

export const apiClient = {
    get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "GET" }),
    post: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "POST", body: JSON.stringify(body) }),
    put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
        request<T>(endpoint, { ...options, method: "PUT", body: JSON.stringify(body) }),
    delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: "DELETE" }),
};
