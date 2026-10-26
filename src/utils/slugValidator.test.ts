// src/utils/slugValidator.test.ts
import { describe, it, expect } from "vitest";
import {
  RESERVED_STOREFRONT_URLS,
  normalizeStorefrontUrl,
  isValidStorefrontUrl,
} from "./slugValidator.ts";

describe("slugValidator", () => {
  it("normalizes storefront URLs by trimming and lowercasing", () => {
    expect(normalizeStorefrontUrl("  Seller01  ")).toBe("seller01");
    expect(normalizeStorefrontUrl("PIXEL_CRAFT-02")).toBe("pixel_craft-02");
  });

  it("accepts valid storefront URLs (3-30 chars, alphanumeric, hyphen, underscore)", () => {
    expect(isValidStorefrontUrl("seller01")).toBe(true);
    expect(isValidStorefrontUrl("seller02")).toBe(true);
    expect(isValidStorefrontUrl("pixel-craft_studio")).toBe(true);
  });

  it("rejects empty, short (<3), long (>30), or invalid characters", () => {
    expect(isValidStorefrontUrl("")).toBe(false);
    expect(isValidStorefrontUrl("ab")).toBe(false);
    expect(isValidStorefrontUrl("-seller01")).toBe(false);
    expect(isValidStorefrontUrl("seller 01")).toBe(false);
    expect(isValidStorefrontUrl("a".repeat(31))).toBe(false);
  });

  it("rejects reserved system routes", () => {
    for (const reserved of ["admin", "seller", "buyer", "catalog", "explore", "storefront"]) {
      expect(RESERVED_STOREFRONT_URLS.has(reserved)).toBe(true);
      expect(isValidStorefrontUrl(reserved)).toBe(false);
      expect(isValidStorefrontUrl(reserved.toUpperCase())).toBe(false);
    }
  });
});

