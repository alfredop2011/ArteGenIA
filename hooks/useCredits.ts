"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Hook para gestionar el balance de créditos en el cliente.
 *
 * Provee:
 *   - balance: número actual (null si aún no cargó o no logueado)
 *   - refetch: vuelve a consultar el endpoint
 *   - consume: descuenta vía /api/credits/consume. Devuelve { success, balance }.
 *
 * El balance se cachea localmente y se sincroniza tras cada consume(). Para
 * mantener el badge del header al día sin spammear el endpoint, polling
 * solo cuando window.focus (no setInterval).
 */

export type CreditsState = {
  balance: number | null;
  monthlyGrant: number | null;
  daysUntilReset: number | null;
  authenticated: boolean;
  loading: boolean;
};

export function useCredits() {
  const [state, setState] = useState<CreditsState>({
    balance: null,
    monthlyGrant: null,
    daysUntilReset: null,
    authenticated: false,
    loading: true,
  });

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/credits", { cache: "no-store" });
      if (!res.ok) {
        setState((s) => ({ ...s, loading: false }));
        return;
      }
      const data = await res.json();
      if (!data.authenticated) {
        setState({ balance: null, monthlyGrant: null, daysUntilReset: null, authenticated: false, loading: false });
        return;
      }
      setState({
        balance: data.balance,
        monthlyGrant: data.monthlyGrant,
        daysUntilReset: data.daysUntilReset,
        authenticated: true,
        loading: false,
      });
    } catch (e) {
      console.error("[useCredits] refetch failed:", e);
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    void refetch();
    // Refrescar al recuperar foco (usuario vuelve a la pestaña tras usar IA)
    const onFocus = () => void refetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetch]);

  /** Consume créditos vía endpoint. Devuelve { success: true, balance } si OK,
   *  { success: false, balance, required } si insuficientes. */
  const consume = useCallback(async (module: string, meta?: Record<string, unknown>) => {
    const res = await fetch("/api/credits/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module, meta }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setState((s) => ({ ...s, balance: data.balance }));
      return { success: true as const, balance: data.balance, consumed: data.consumed };
    }
    if (res.status === 402) {
      setState((s) => ({ ...s, balance: data.balance }));
      return { success: false as const, balance: data.balance, required: data.required, error: "insufficient_credits" };
    }
    throw new Error(data.error || "consume failed");
  }, []);

  return { ...state, refetch, consume };
}
