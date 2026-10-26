// src/features/seller-dashboard/utils/storefrontDraft.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  dataUrlToBlob,
  getStorefrontDraft,
  setStorefrontDraft,
  clearStorefrontDraftNow,
  scheduleClearStorefrontDraft,
  cancelClearStorefrontDraft,
} from "./storefrontDraft.ts";

describe("storefrontDraft utilities", () => {
  beforeEach(() => {
    clearStorefrontDraftNow();
  });

  it("converts a base64 data URL into a Blob synchronously without calling fetch", () => {
    // 1x1 transparent PNG in base64
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const dataUrl = `data:image/png;base64,${pngBase64}`;

    const blob = dataUrlToBlob(dataUrl);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBeGreaterThan(0);
  });

  it("preserves in-memory draft across errors and clears on explicit reset or unmount", () => {
    expect(getStorefrontDraft()).toBeNull();

    setStorefrontDraft({
      values: {
        url: "dgarts",
        title: "DG Arts",
        description: "Curated digital assets and design tools",
        bannerUrl: "data:image/webp;base64,UklGRhIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=",
        featuredAssetId: "",
        isVisible: true,
      },
      rawBannerSource: "data:image/webp;base64,UklGRhIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=",
      localPreviewUrl: "data:image/webp;base64,UklGRhIAAABXRUJQVlA4TAYAAAAvAAAAAAfQ//73v/+BiOh/AAA=",
      uploadedDimensions: { width: 1200, height: 400 },
      uploadedFileName: "banner.webp",
      pendingBannerBlob: new Blob(["bytes"], { type: "image/webp" }),
      hasUserEdits: true,
    });

    expect(getStorefrontDraft()?.values.url).toBe("dgarts");
    expect(getStorefrontDraft()?.hasUserEdits).toBe(true);

    // Simulated StrictMode unmount + immediate remount keeps draft
    scheduleClearStorefrontDraft();
    cancelClearStorefrontDraft();
    expect(getStorefrontDraft()?.values.title).toBe("DG Arts");

    // Actual navigation unmount clears draft
    clearStorefrontDraftNow();
    expect(getStorefrontDraft()).toBeNull();
  });
});

