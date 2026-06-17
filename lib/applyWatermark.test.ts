import { describe, it, expect } from "vitest";
import { shouldWatermark } from "./applyWatermark";

describe("shouldWatermark (Fase T.12 — desactivado para todos los planes)", () => {
  // WATERMARK_ENABLED esta en false desde Fase T.12.
  // Decisión de producto: "Sin watermark, siempre" como diferenciador vs Canva.
  // Por tanto shouldWatermark() devuelve false para CUALQUIER plan/input.
  // Estos tests fijan ese contrato; al reactivar el flag habrá que revisarlos.

  it("free → sin watermark (Fase T.12)", () => {
    expect(shouldWatermark("free")).toBe(false);
  });

  it("pro → sin watermark", () => {
    expect(shouldWatermark("pro")).toBe(false);
  });

  it("enterprise → sin watermark", () => {
    expect(shouldWatermark("enterprise")).toBe(false);
  });

  it("null/undefined → sin watermark", () => {
    expect(shouldWatermark(null)).toBe(false);
    expect(shouldWatermark(undefined)).toBe(false);
    expect(shouldWatermark()).toBe(false);
  });

  it("string desconocida → sin watermark", () => {
    expect(shouldWatermark("custom_plan_unknown")).toBe(false);
  });
});
