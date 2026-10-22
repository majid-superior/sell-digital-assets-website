// src/utils/clipboard.ts

/**
 * Copies a string to the system clipboard using the asynchronous Clipboard API,
 * with a fallback to document.execCommand("copy") for legacy browsers or
 * environments with restricted clipboard permissions.
 *
 * @param text The text to copy.
 * @returns Promise resolving to true if copied successfully, false otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text || typeof window === "undefined") {
    return false;
  }

  // Modern Asynchronous Clipboard API
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Permission rejected, iframe sandbox restriction, or insecure context; fallback below
    }
  }

  // Document execCommand fallback
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.setAttribute("readonly", "");
    textArea.setAttribute("aria-hidden", "true");
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

/**
 * Generates the canonical, publicly accessible URL for an asset detail page.
 * Uses the asset's existing slug or unique identifier.
 *
 * @param asset The asset entity containing slug and/or id.
 * @param origin Optional origin override (e.g., for SSR or testing). Defaults to window.location.origin.
 * @returns Fully qualified public URL to the asset detail page.
 */
export function getAssetPublicUrl(
  asset: { slug?: string | null; id: string },
  origin?: string,
): string {
  const baseOrigin = (
    origin || (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/+$/, "");

  const identifier = (asset.slug && asset.slug.trim()) || asset.id;
  const path = `/asset/${encodeURIComponent(identifier)}`;

  return baseOrigin ? `${baseOrigin}${path}` : path;
}

