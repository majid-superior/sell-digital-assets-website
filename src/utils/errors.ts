// src/utils/errors.ts

/**
 * Universal human-understandable error extractor for client notifications.
 * Translates technical error objects, network failures, and raw HTTP status codes
 * into clear, user-friendly language with actionable recovery guidance.
 */
export function getHumanErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again."
): string {
  if (!error) return fallbackMessage;

  // 1. String errors
  if (typeof error === "string") {
    return cleanRawErrorMessage(error);
  }

  // 2. Standard Error instance or ApiError
  if (error instanceof Error) {
    const rawMsg = error.message;

    // Check for HTTP 413 / Payload Too Large
    if (rawMsg.includes("413") || rawMsg.toLowerCase().includes("payload too large")) {
      return "The uploaded file exceeds the maximum allowed file size limit (10 MB for showcase media). Please select a smaller file or compress the image.";
    }

    // Check for network connection / offline issues
    if (
      rawMsg.toLowerCase().includes("network error") ||
      rawMsg.toLowerCase().includes("failed to fetch") ||
      rawMsg.toLowerCase().includes("network connection")
    ) {
      return "Unable to connect to the server. Please check your internet connection or verify the service is running.";
    }

    // Check for timeout errors
    if (rawMsg.toLowerCase().includes("timeout") || rawMsg.toLowerCase().includes("timed out")) {
      return "The server took too long to respond. Please try again in a moment.";
    }

    // Check for authorization / signature issues
    if (
      rawMsg.toLowerCase().includes("signature token") ||
      rawMsg.toLowerCase().includes("unauthorized") ||
      rawMsg.toLowerCase().includes("403")
    ) {
      return "Upload authorization has expired or is invalid. Please refresh the page and try again.";
    }

    return cleanRawErrorMessage(rawMsg);
  }

  // 3. Object with message property
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === "string" && obj.message.trim()) {
      return cleanRawErrorMessage(obj.message.trim());
    }
    if (typeof obj.error === "string" && obj.error.trim()) {
      return cleanRawErrorMessage(obj.error.trim());
    }
  }

  return fallbackMessage;
}

/**
 * Strips raw HTTP prefixes like "Upload failed with HTTP status 413" or "API Error 500:"
 * into human-readable sentences.
 */
function cleanRawErrorMessage(msg: string): string {
  if (/HTTP status 413/i.test(msg) || /status 413/i.test(msg)) {
    return "The uploaded file exceeds the allowed file size limit (10 MB for showcase media). Please compress or choose a smaller file.";
  }

  if (/HTTP status 400/i.test(msg)) {
    return "The server rejected the request due to invalid data formatting. Please check your inputs.";
  }

  if (/HTTP status 401/i.test(msg)) {
    return "Your session has expired. Please sign in again to continue.";
  }

  if (/HTTP status 403/i.test(msg)) {
    return "You do not have permission to perform this action, or the upload session expired.";
  }

  if (/HTTP status 404/i.test(msg)) {
    return "The requested resource could not be found.";
  }

  if (/HTTP status (500|502|503|504)/i.test(msg)) {
    return "The server encountered a temporary issue. Please try again in a few moments.";
  }

  return msg;
}

