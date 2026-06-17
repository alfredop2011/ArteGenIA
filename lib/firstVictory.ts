/**
 * "Primera victoria" del usuario — el primer momento en que ArteGenIA
 * le dio valor real (una descarga completada). Persiste en localStorage
 * y dispara un CustomEvent para que componentes interesados reaccionen
 * sin recargar.
 *
 * Uso: pedir feedback al user (modal de tipo de organizador) SOLO tras
 * la primera victoria. El acta detectó que pedirlo antes era pedir
 * info sin haber dado valor primero.
 */

const KEY = "ag.firstVictory.v1";
const EVENT = "ag:firstVictory";

export function hasFirstVictory(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

export function markFirstVictory(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(KEY) === "1") return; // idempotente
  window.localStorage.setItem(KEY, "1");
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Hook estilo addEventListener — devuelve unsubscribe. */
export function onFirstVictory(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
