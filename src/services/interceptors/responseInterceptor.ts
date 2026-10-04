// src/services/interceptors/responseInterceptor.ts

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

/**
 * Handle non-ok HTTP responses, dispatching auth expiration and packaging server error payloads.
 */
export async function handleResponseError(response: Response): Promise<never> {
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
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        }
    }

    throw new ApiError(response.status, response.statusText, errorData);
}

/**
 * Parse successful response body with status 204 support and robust JSON error handling.
 */
export async function parseResponseBody<T>(response: Response): Promise<T> {
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
