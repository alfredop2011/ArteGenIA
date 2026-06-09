import { describe, it, expect } from "vitest";
import { shouldWatermark } from "./applyWatermark";

describe("shouldWatermark (V8.2 activado)", () => {
  // WATERMARK_ENABLED esta en true desde V8.2.
  // - free / null / undefined / desconocido → watermark (true)
  // - pro / enterprise → sin watermark (false)

  it("free → watermark (incentivo para upgrade)", () => {
    expect(shouldWatermark("free")).toBe(true);
  });

  it("pro → sin watermark", () => {
    expect(shouldWatermark("pro")).toBe(false);
  });

  it("enterprise → sin watermark", () => {
    expect(shouldWatermark("enterprise")).toBe(false);
  });

  it("null/undefined → watermark por seguridad (asume free)", () => {
    expect(shouldWatermark(null)).toBe(true);
    expect(shouldWatermark(undefined)).toBe(true);
    expect(shouldWatermark()).toBe(true);
  });

  it("string desconocida → watermark (no fallar a free)", () => {
    expect(shouldWatermark("custom_plan_unknown")).toBe(true);
  });
});
