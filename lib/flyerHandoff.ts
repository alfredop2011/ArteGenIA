import { supabase } from "@/lib/supabase";

const ARTEGENIA = "https://artegenia.com";

/**
 * SSO seamless agenda (peligroficial.com) → app de flyers (artegenia.com).
 *
 * Las cookies de sesión son por dominio: estar logueado en peligroficial NO
 * te loguea en artegenia (aunque sea la misma cuenta Supabase). Para que el
 * usuario llegue a artegenia YA logueado, pasamos la sesión por handoff:
 *
 *  - Construimos `artegenia.com/auth/handoff#at=<access>&rt=<refresh>&next=…`.
 *  - Los tokens van en el FRAGMENT (#), que NO se envía al servidor ni a logs
 *    ni al Referer. La página /auth/handoff hace setSession y limpia la URL.
 *
 * Si ya estamos en artegenia (misma sesión) → enlace interno normal.
 * Si no hay sesión → vamos a artegenia normal (allí harán login).
 */
export async function flyerAppHref(next = "/templates"): Promise<string> {
  // En artegenia ya compartimos cookies → enlace interno directo.
  if (typeof window !== "undefined" && window.location.hostname.includes("artegenia")) {
    return next;
  }
  try {
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (s?.access_token && s?.refresh_token) {
      const frag = new URLSearchParams({ at: s.access_token, rt: s.refresh_token, next });
      return `${ARTEGENIA}/auth/handoff#${frag.toString()}`;
    }
  } catch {
    /* sin sesión o error → enlace normal */
  }
  return `${ARTEGENIA}${next.startsWith("/") ? next : "/templates"}`;
}

/** onClick listo para usar en los enlaces "Crea Flyer". Hace el handoff y navega. */
export function goToFlyerApp(next = "/templates") {
  return async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    const url = await flyerAppHref(next);
    window.location.href = url;
  };
}
