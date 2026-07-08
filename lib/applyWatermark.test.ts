import { describe, it, expect } from "vitest";
import { shouldWatermark } from "./applyWatermark";

describe("shouldWatermark (P0.T1 — watermark en Free, limpio en Pro/Enterprise)", () => {
  // WATERMARK_ENABLED reactivado en P0.T1 (jul 2026): las descargas son
  // gratis e ilimitadas en todos los planes, así que la marca de agua en
  // Free vuelve a ser la palanca de upgrade a Pro. Contrato:
  //   free / no logueado / plan desconocido → CON watermark
  //   pro / enterprise                      → SIN watermark

  it("free → con watermark", () => {
    expect(shouldWatermark("free")).toBe(true);
  });

  it("pro → sin watermark", () => {
    expect(shouldWatermark("pro")).toBe(false);
  });

  it("enterprise → sin watermark", () => {
    expect(shouldWatermark("enterprise")).toBe(false);
  });

  it("null/undefined (no logueado) → con watermark", () => {
    expect(shouldWatermark(null)).toBe(true);
    expect(shouldWatermark(undefined)).toBe(true);
    expect(shouldWatermark()).toBe(true);
  });

  it("string desconocida → con watermark (fail-safe hacia Free)", () => {
    expect(shouldWatermark("custom_plan_unknown")).toBe(true);
  });
});
