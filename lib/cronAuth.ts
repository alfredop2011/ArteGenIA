import { timingSafeEqual } from "node:crypto";

/**
 * Autorización para endpoints de Vercel Cron.
 *
 * Vercel inyecta `Authorization: Bearer <CRON_SECRET>` cuando CRON_SECRET está
 * configurado en env vars. Exigimos SIEMPRE ese secret (sin fallback al header
 * `x-vercel-cron`, que es trivialmente falsificable por cualquiera en Internet).
 *
 * La comparación es timing-safe para no filtrar el secret por canal lateral.
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // sin secret configurado → denegar (fail-closed)

  const auth = req.headers.get("authorization");
  if (!auth) return false;

  const expected = `Bearer ${secret}`;
  // timingSafeEqual exige buffers de igual longitud; comparamos longitud aparte
  // (la longitud del secret no es información sensible que valga la pena ocultar).
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
