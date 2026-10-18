import { describe, it, expect, vi } from "vitest";
import * as core from "zod/v4/core";
import { z } from "./zod.ts";

describe("Zod jitless mode configuration", () => {
  it("enables jitless mode in Zod globalConfig", () => {
    expect(core.globalConfig.jitless).toBe(true);
    expect(z.config().jitless).toBe(true);
  });

  it("prevents new Function eval probe from running under strict CSP", () => {
    const origFunction = globalThis.Function;
    const functionSpy = vi.fn((...args: string[]) => new origFunction(...args));
    (globalThis as unknown as { Function: typeof origFunction }).Function = functionSpy;

    try {
      expect(core.util.allowsEval.value).toBe(false);
      expect(functionSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.Function = origFunction;
    }
  });

  it("successfully parses schemas using interpreted parsing without error", () => {
    const testSchema = z.object({
      name: z.string(),
      count: z.number().int(),
      active: z.boolean().default(true),
    });

    const parsed = testSchema.safeParse({
      name: "Digital Asset",
      count: 42,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        name: "Digital Asset",
        count: 42,
        active: true,
      });
    }
  });
});

