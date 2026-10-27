// src/services/interceptors/responseInterceptor.ts

export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly data: unknown;

  constructor(
    status: number,
    statusText: string,
    data: unknown,
    options?: { cause?: unknown },
  ) {
    let resolvedMessage = "";
    if (data && typeof data === "object") {
      const dataObj = data as Record<string, unknown>;
      if (typeof dataObj.message === "string" && dataObj.message.trim()) {
        resolvedMessage = dataObj.message.trim();
      } else if (typeof dataObj.error === "string" && dataObj.error.trim()) {
        resolvedMessage = dataObj.error.trim();
      }

      // If validation details exist, append field errors in human-readable format
      if (dataObj.details && typeof dataObj.details === "object") {
        const detailsObj = dataObj.details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
        if (detailsObj.fieldErrors && typeof detailsObj.fieldErrors === "object") {
          const fieldEntries = Object.entries(detailsObj.fieldErrors);
          if (fieldEntries.length > 0) {
            const firstIssues = fieldEntries
              .slice(0, 3)
              .map(([field, errs]) => `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`)
              .join("; ");
            resolvedMessage = resolvedMessage ? `${resolvedMessage} (${firstIssues})` : firstIssues;
          }
        }
      }
    } else if (typeof data === "string" && data.trim()) {
      resolvedMessage = data.trim();
    }

    // Sanitize any raw technical database, socket, or connection errors from server
    if (
      /ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ECONNRESET/i.test(resolvedMessage) ||
      /getaddrinfo/i.test(resolvedMessage) ||
      /database system is starting up/i.test(resolvedMessage) ||
      /terminating connection/i.test(resolvedMessage) ||
      /password authentication failed/i.test(resolvedMessage) ||
      /database .* does not exist/i.test(resolvedMessage) ||
      /Internal Server Error/i.test(resolvedMessage)
    ) {
      resolvedMessage = "The server is temporarily unavailable. Please try again shortly.";
    }

    if (!resolvedMessage) {
      switch (status) {
        case 400:
          resolvedMessage = "The request could not be processed due to invalid parameters or formatting.";
          break;
        case 401:
          resolvedMessage = "Authentication is required or your session has expired. Please sign in.";
          break;
        case 403:
          resolvedMessage = "You do not have permission to perform this action.";
          break;
        case 404:
          resolvedMessage = "The requested resource could not be found.";
          break;
        case 409:
          resolvedMessage = "A resource conflict occurred (e.g. duplicate name, slug, or entry).";
          break;
        case 413:
          resolvedMessage = "The uploaded file exceeds the allowed size limit (Payload Too Large). Please choose a smaller file.";
          break;
        case 415:
          resolvedMessage = "The file format or media type is not supported.";
          break;
        case 422:
          resolvedMessage = "Validation failed. Please verify the submitted information.";
          break;
        case 429:
          resolvedMessage = "Too many requests. Please wait a moment and try again.";
          break;
        case 500:
          resolvedMessage = "An internal server error occurred. Please try again in a few moments.";
          break;
        case 502:
        case 503:
        case 504:
          resolvedMessage = "The server is temporarily unavailable or undergoing maintenance. Please try again shortly.";
          break;
        default:
          resolvedMessage = statusText ? `Request failed (${status}: ${statusText})` : `Request failed with status ${status}`;
          break;
      }
    }

    super(resolvedMessage, options);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

/**
 * Handle non-ok HTTP responses, dispatching auth expiration and packaging server error payloads.
 */
export async function handleResponseError(
  response: Response,
  endpoint?: string,
): Promise<never> {
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

  // Do not trigger global auth expiration on authentication endpoints (/auth/signin, /auth/signup, /auth/register)
  // or when a profile update (/auth/me) fails due to an incorrect currentPassword.
  const targetUrl = (endpoint || response.url || "").toLowerCase();
  const rawErrMsg =
    errorData && typeof errorData === "object" && "message" in errorData && typeof (errorData as { message?: unknown }).message === "string"
      ? (errorData as { message: string }).message.toLowerCase()
      : "";
  const isMePasswordMismatch =
    targetUrl.includes("/auth/me") && rawErrMsg.includes("current password");
  const isAuthEndpoint =
    targetUrl.includes("/auth/signin") ||
    targetUrl.includes("/auth/signup") ||
    targetUrl.includes("/auth/login") ||
    targetUrl.includes("/auth/register") ||
    targetUrl.includes("/auth/refresh") ||
    isMePasswordMismatch;

  if (response.status === 401 && !isAuthEndpoint) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("auth:session-expired"));
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
      { cause: parseError },
    );
  }
}
