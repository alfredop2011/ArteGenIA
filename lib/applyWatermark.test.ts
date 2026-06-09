import { describe, it, expect } from "vitest";
import { shouldWatermark } from "./applyWatermark";

describe("shouldWatermark", () => {
  // El comportamiento depende de la constante WATERMARK_ENABLED interna.
  // En MVP esta en `false` → siempre devuelve false sin importar el plan.
  // Cuando se active a `true`, devolvera true para free y false para pro+.

  it("free siempre return false (flag desactivado en MVP)", () => {
    expect(shouldWatermark("free")).toBe(false);
  });

  it("pro return false (no llevan watermark)", () => {
    expect(shouldWatermark("pro")).toBe(false);
  });

  it("enterprise return false", () => {
    expect(shouldWatermark("enterprise")).toBe(false);
  });

  it("null/undefined no rompe", () => {
    expect(shouldWatermark(null)).toBe(false);
    expect(shouldWatermark(undefined)).toBe(false);
    expect(shouldWatermark()).toBe(false);
  });

  it("string desconocida no rompe", () => {
    expect(shouldWatermark("custom_plan_unknown")).toBe(false);
  });
});

// NOTA: applyWatermark() en si NO se testa por dos motivos:
//   1. Requiere DOM real (HTMLImageElement, canvas) — happy-dom no implementa
//      canvas 2D context completo
//   2. Es composicion pura — si dataURL entra valido, sale valido (probado
//      manualmente en producción)
// Si en el futuro se añade Puppeteer/headless Chrome al CI, se puede
// añadir un test que renderice una imagen base y verifique pixel del
// quadrant inferior derecho.
