import type { NextRequest } from "next/server";

/**
 * Protección del link público de subida de eventos (/subir).
 * Si existe EVENT_SUBMIT_KEY, se exige ?k= (o cabecera x-submit-key) que
 * coincida → el admin comparte un enlace privado. Si no está configurada,
 * queda abierto (recomendado configurarla para evitar spam).
 */
export function publicSubmitKeyOk(req: NextRequest): boolean {
  const required = process.env.EVENT_SUBMIT_KEY;
  if (!required) return true;
  const k = new URL(req.url).searchParams.get("k") || req.headers.get("x-submit-key");
  return k === required;
}
