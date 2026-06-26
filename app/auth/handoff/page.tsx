"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Receptor del SSO seamless (ver lib/flyerHandoff.ts).
 *
 * Llega como artegenia.com/auth/handoff#at=<access>&rt=<refresh>&next=…
 * Los tokens vienen en el FRAGMENT (no en query): no se envían al servidor ni
 * a logs. Aquí, en cliente:
 *   1. Leemos el fragment.
 *   2. Limpiamos la URL inmediatamente (history.replaceState) para no dejar
 *      tokens en la barra ni en el historial.
 *   3. setSession → la sesión queda en cookies de artegenia (ya logueado).
 *   4. Redirigimos a `next` (validado interno).
 */
export default function AuthHandoffPage() {
  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const p = new URLSearchParams(hash);
    const at = p.get("at");
    const rt = p.get("rt");
    let next = p.get("next") || "/templates";
    // Open-redirect guard: solo rutas internas.
    if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) next = "/templates";

    // Borra los tokens de la URL/historial cuanto antes.
    try { window.history.replaceState(null, "", "/auth/handoff"); } catch { /* noop */ }

    (async () => {
      if (at && rt) {
        try {
          await supabase.auth.setSession({ access_token: at, refresh_token: rt });
        } catch {
          /* si falla, seguimos: el destino pedirá login normal */
        }
      }
      window.location.replace(next);
    })();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--home-bg)", color: "var(--home-text-soft)" }}>
      <div className="flex items-center gap-3 text-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Entrando…
      </div>
    </div>
  );
}
