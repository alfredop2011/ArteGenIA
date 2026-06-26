import { supabase } from "@/lib/supabase";

const ARTEGENIA = "https://artegenia.com";
const PELIGRO = "https://peligroficial.com";

/**
 * SSO seamless entre los dos dominios (artegenia ↔ peligroficial).
 *
 * Las cookies de sesión son por dominio: estar logueado en uno NO te loguea en
 * el otro (aunque sea la misma cuenta Supabase). Para llegar logueado al otro
 * dominio, pasamos la sesión por handoff:
 *   - `${target}/auth/handoff#at=<access>&rt=<refresh>&next=…`
 *   - Los tokens van en el FRAGMENT (#): NO se envían al servidor, ni a logs,
 *     ni al Referer. La página /auth/handoff hace setSession y limpia la URL.
 *
 * Si ya estamos en el dominio destino → enlace interno. Sin sesión → enlace
 * normal (allí harán login si hace falta).
 */
async function crossHref(targetBase: string, hostKey: string, next: string): Promise<string> {
  // En el propio dominio destino compartimos cookies → enlace interno directo.
  if (typeof window !== "undefined" && window.location.hostname.includes(hostKey)) {
    return next;
  }
  try {
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    if (s?.access_token && s?.refresh_token) {
      const frag = new URLSearchParams({ at: s.access_token, rt: s.refresh_token, next });
      return `${targetBase}/auth/handoff#${frag.toString()}`;
    }
  } catch {
    /* sin sesión o error → enlace normal */
  }
  return `${targetBase}${next.startsWith("/") ? next : "/"}`;
}

/** URL a la app de flyers (artegenia) llevando la sesión si la hay. */
export function flyerAppHref(next = "/templates") {
  return crossHref(ARTEGENIA, "artegenia", next);
}
/** URL a la agenda (peligroficial) llevando la sesión si la hay. */
export function agendaHref(next = "/") {
  return crossHref(PELIGRO, "peligro", next);
}

/** onClick listo: navega a la app de flyers (mismo tab) con handoff. */
export function goToFlyerApp(next = "/templates") {
  return async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    window.location.href = await flyerAppHref(next);
  };
}
/** onClick listo: navega a la agenda (peligroficial) con handoff. */
export function goToAgenda(next = "/") {
  return async (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    window.location.href = await agendaHref(next);
  };
}
