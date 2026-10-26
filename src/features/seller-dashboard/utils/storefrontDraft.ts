// src/features/seller-dashboard/utils/storefrontDraft.ts
import type { UpdateStorefrontPayload } from "../types.ts";

export interface StorefrontDraftState {
  values: UpdateStorefrontPayload;
  rawBannerSource: string | null;
  localPreviewUrl: string | null;
  uploadedDimensions: { width: number; height: number } | null;
  uploadedFileName: string;
  pendingBannerBlob: Blob | null;
  hasUserEdits: boolean;
}

const draftStore: {
  activeDraft: StorefrontDraftState | null;
  lastSyncedServerKey: string;
  unmountClearTimer: ReturnType<typeof setTimeout> | null;
} = {
  activeDraft: null,
  lastSyncedServerKey: "",
  unmountClearTimer: null,
};

/**
 * Synchronously converts a base64 `data:image/...` URL into a binary `Blob`
 * without calling `fetch()`, avoiding Content-Security-Policy `connect-src` restrictions.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) {
    throw new Error("Invalid banner image data format.");
  }
  const header = dataUrl.slice(0, commaIdx);
  const payload = dataUrl.slice(commaIdx + 1);
  const mimeMatch = header.match(/^data:([^;,]+)(;base64)?$/i);
  const mimeType = mimeMatch?.[1] || "image/webp";
  const isBase64 = Boolean(mimeMatch?.[2]);

  if (!isBase64) {
    const decoded = decodeURIComponent(payload);
    return new Blob([decoded], { type: mimeType });
  }

  const binaryString = atob(payload);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function getStorefrontDraft(): StorefrontDraftState | null {
  return draftStore.activeDraft;
}

export function setStorefrontDraft(draft: StorefrontDraftState): void {
  draftStore.activeDraft = draft;
}

export function getLastSyncedServerKey(): string {
  return draftStore.lastSyncedServerKey;
}

export function setLastSyncedServerKey(key: string): void {
  draftStore.lastSyncedServerKey = key;
}

export function clearStorefrontDraftNow(): void {
  if (draftStore.unmountClearTimer) {
    clearTimeout(draftStore.unmountClearTimer);
    draftStore.unmountClearTimer = null;
  }
  draftStore.activeDraft = null;
  draftStore.lastSyncedServerKey = "";
}

export function scheduleClearStorefrontDraft(): void {
  if (draftStore.unmountClearTimer) {
    clearTimeout(draftStore.unmountClearTimer);
  }
  draftStore.unmountClearTimer = setTimeout(() => {
    draftStore.activeDraft = null;
    draftStore.lastSyncedServerKey = "";
    draftStore.unmountClearTimer = null;
  }, 60);
}

export function cancelClearStorefrontDraft(): void {
  if (draftStore.unmountClearTimer) {
    clearTimeout(draftStore.unmountClearTimer);
    draftStore.unmountClearTimer = null;
  }
}

