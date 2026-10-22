// src/utils/clipboard.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { copyToClipboard, getAssetPublicUrl } from "./clipboard.ts";

describe("getAssetPublicUrl", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: {
        origin: "http://localhost:5173",
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("generates the public URL using the asset's slug", () => {
    const asset = { id: "asset-123", slug: "awesome-3d-model" };
    const url = getAssetPublicUrl(asset, "https://example.com");
    expect(url).toBe("https://example.com/asset/awesome-3d-model");
  });

  it("falls back to asset ID when slug is undefined or empty", () => {
    const assetWithoutSlug = { id: "123e4567-e89b-12d3-a456-426614174000" };
    const url = getAssetPublicUrl(assetWithoutSlug, "https://example.com");
    expect(url).toBe("https://example.com/asset/123e4567-e89b-12d3-a456-426614174000");

    const assetWithEmptySlug = { id: "asset-456", slug: "   " };
    const url2 = getAssetPublicUrl(assetWithEmptySlug, "https://example.com");
    expect(url2).toBe("https://example.com/asset/asset-456");
  });

  it("normalizes base origin trailing slashes", () => {
    const asset = { id: "asset-789", slug: "cyberpunk-shader" };
    const url = getAssetPublicUrl(asset, "https://assetdrop.com///");
    expect(url).toBe("https://assetdrop.com/asset/cyberpunk-shader");
  });

  it("encodes special characters in slug", () => {
    const asset = { id: "asset-999", slug: "cool font & kit" };
    const url = getAssetPublicUrl(asset, "https://assetdrop.com");
    expect(url).toBe("https://assetdrop.com/asset/cool%20font%20%26%20kit");
  });

  it("uses window.location.origin when origin parameter is omitted", () => {
    const asset = { id: "asset-100", slug: "synthwave-preset" };
    const url = getAssetPublicUrl(asset);
    expect(url).toBe("http://localhost:5173/asset/synthwave-preset");
  });
});

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns false if text is empty", async () => {
    const result = await copyToClipboard("");
    expect(result).toBe(false);
  });

  it("returns false if window is undefined", async () => {
    vi.stubGlobal("window", undefined);
    const result = await copyToClipboard("https://assetdrop.com");
    expect(result).toBe(false);
  });

  it("copies successfully using modern navigator.clipboard.writeText", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const result = await copyToClipboard("https://assetdrop.com/asset/cyberpunk");
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith("https://assetdrop.com/asset/cyberpunk");
  });

  it("falls back to document.execCommand when navigator.clipboard fails", async () => {
    const appendChildMock = vi.fn();
    const removeChildMock = vi.fn();
    const execCommandMock = vi.fn().mockReturnValue(true);

    const mockTextArea = {
      value: "",
      style: {},
      setAttribute: vi.fn(),
      focus: vi.fn(),
      select: vi.fn(),
    };

    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
    });
    vi.stubGlobal("document", {
      createElement: vi.fn().mockReturnValue(mockTextArea),
      body: {
        appendChild: appendChildMock,
        removeChild: removeChildMock,
      },
      execCommand: execCommandMock,
    });

    const result = await copyToClipboard("https://assetdrop.com/asset/fallback");
    expect(result).toBe(true);
    expect(execCommandMock).toHaveBeenCalledWith("copy");
    expect(appendChildMock).toHaveBeenCalledWith(mockTextArea);
    expect(removeChildMock).toHaveBeenCalledWith(mockTextArea);
  });

  it("returns false when both modern clipboard and execCommand fail", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
    });
    vi.stubGlobal("document", {
      createElement: vi.fn().mockImplementation(() => {
        throw new Error("DOM error");
      }),
    });

    const result = await copyToClipboard("https://assetdrop.com/asset/fail");
    expect(result).toBe(false);
  });
});

