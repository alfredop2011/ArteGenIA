import { describe, it, expect, vi } from "vitest";
import { RATE_LIMITS, checkRateLimit } from "./rateLimit";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("RATE_LIMITS config", () => {
  it("acciones IA criticas estan configuradas", () => {
    const required = [
      "segment-person", "segment-person-hd",
      "generate-bg", "remove-bg", "refine-hd",
      "chat-wizard", "parse-prompt",
    ];
    for (const action of required) {
      expect(RATE_LIMITS[action], `${action} sin config`).toBeDefined();
      expect(RATE_LIMITS[action].max).toBeGreaterThan(0);
      expect(RATE_LIMITS[action].windowMinutes).toBeGreaterThan(0);
    }
  });

  it("acciones HD tienen limite mas bajo que normal (mas caro)", () => {
    expect(RATE_LIMITS["segment-person-hd"].max)
      .toBeLessThanOrEqual(RATE_LIMITS["segment-person"].max);
  });

  it("limites razonables (no excesivos)", () => {
    for (const [action, config] of Object.entries(RATE_LIMITS)) {
      // Mas de 100/min seria sospechoso (gasto demasiado en 1 minuto)
      expect(config.max, `${action} demasiado permisivo`).toBeLessThanOrEqual(100);
      // Ventana mayor a 60 min sospechoso (rate limit largo, mejor cuota mensual)
      expect(config.windowMinutes, `${action} ventana muy larga`).toBeLessThanOrEqual(60);
    }
  });
});

describe("checkRateLimit behavior", () => {
  // Helper: crea un mock de SupabaseClient
  const mockSupabase = (rpcReturn: { data: number | null; error: Error | null }) => ({
    rpc: vi.fn().mockResolvedValue(rpcReturn),
  } as unknown as SupabaseClient);

  it("permite si uso < limite", async () => {
    const sb = mockSupabase({ data: 2, error: null });
    const res = await checkRateLimit(sb, "user-123", "generate-bg");
    expect(res).toBeNull();
  });

  it("bloquea con 429 si uso >= limite", async () => {
    const limit = RATE_LIMITS["generate-bg"].max;
    const sb = mockSupabase({ data: limit, error: null });
    const res = await checkRateLimit(sb, "user-123", "generate-bg");
    expect(res).not.toBeNull();
    expect(res!.status).toBe(429);
  });

  it("bloquea con headers de rate limit", async () => {
    const limit = RATE_LIMITS["generate-bg"].max;
    const sb = mockSupabase({ data: limit + 5, error: null });
    const res = await checkRateLimit(sb, "user-123", "generate-bg");
    expect(res).not.toBeNull();
    expect(res!.headers.get("Retry-After")).toBeTruthy();
    expect(res!.headers.get("X-RateLimit-Limit")).toBe(String(limit));
  });

  it("fail-open si la RPC de Supabase falla (no bloquear)", async () => {
    const sb = mockSupabase({ data: null, error: new Error("RPC down") });
    const res = await checkRateLimit(sb, "user-123", "generate-bg");
    // Preferimos fail-open a romper el producto cuando hay error infra
    expect(res).toBeNull();
  });

  it("fail-open si la accion no esta configurada", async () => {
    const sb = mockSupabase({ data: 0, error: null });
    const res = await checkRateLimit(sb, "user-123", "accion-no-existente");
    expect(res).toBeNull();
  });
});
