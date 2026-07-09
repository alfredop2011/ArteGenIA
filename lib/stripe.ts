import Stripe from "stripe";

/**
 * Cliente Stripe server-side (no usar en client components).
 *
 * Requiere STRIPE_SECRET_KEY en variables de entorno. La key empieza por:
 * - sk_test_... para entorno de pruebas
 * - sk_live_... para producción
 *
 * En desarrollo usa sk_test_; en producción cambiar a sk_live_ y rotar la
 * webhook secret correspondiente.
 */

const apiKey = process.env.STRIPE_SECRET_KEY;
if (!apiKey && typeof window === "undefined") {
  console.warn("[stripe] STRIPE_SECRET_KEY no definida — checkout fallará.");
}

export const stripe = new Stripe(apiKey ?? "sk_test_dummy", {
  // Pinear API version evita breakages cuando Stripe actualiza.
  // Si actualizas, lee changelog: https://stripe.com/docs/upgrades
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
});

/** Price IDs Stripe. Crear en Dashboard:
 *  Products → Add product → "ArteGenIA Pro" con DOS prices:
 *    - 9,99€/mes recurrente → STRIPE_PRO_PRICE_ID
 *    - 95,90€/año recurrente (= 7,99€/mes × 12 con 20% off) → STRIPE_PRO_PRICE_ID_YEARLY
 *  Mismo Product, DOS Prices (mensual y anual). Stripe permite varios prices
 *  por product. */
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
export const PRO_PRICE_ID_YEARLY = process.env.STRIPE_PRO_PRICE_ID_YEARLY ?? "";
export const ENTERPRISE_PRICE_ID = process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "";
export const ENTERPRISE_PRICE_ID_YEARLY = process.env.STRIPE_ENTERPRISE_PRICE_ID_YEARLY ?? "";
// P0.T2 — Precio "Fundador" 7,99€/mes. Oculto de /pricing (decisión D);
// se distribuye solo por payment link privado en DMs/WhatsApp. Otorga el
// mismo plan "pro" que el precio normal, solo cambia el importe.
export const PRO_FOUNDER_PRICE_ID = process.env.STRIPE_PRO_FOUNDER_PRICE_ID ?? "";

export type PlanKey = "pro" | "enterprise";
export type BillingInterval = "month" | "year";

/** Mapea (plan, interval) → price ID Stripe. Si el interval anual no está
 *  configurado, cae al mensual (degradación segura — el user paga mensual
 *  en vez de fallar el checkout). */
export function priceIdFor(plan: PlanKey, interval: BillingInterval = "month"): string {
  if (plan === "enterprise") {
    return interval === "year" && ENTERPRISE_PRICE_ID_YEARLY
      ? ENTERPRISE_PRICE_ID_YEARLY
      : ENTERPRISE_PRICE_ID;
  }
  return interval === "year" && PRO_PRICE_ID_YEARLY ? PRO_PRICE_ID_YEARLY : PRO_PRICE_ID;
}

/** Reverse lookup: dado un price ID, ¿qué plan es? Devuelve null si
 *  el ID no coincide con ningún price configurado (puede pasar si el
 *  user tenía un plan legacy borrado). */
export function planFromPriceId(priceId: string): PlanKey | null {
  if (!priceId) return null;
  if (priceId === ENTERPRISE_PRICE_ID || priceId === ENTERPRISE_PRICE_ID_YEARLY) return "enterprise";
  // El precio Fundador da plan Pro igual que el precio normal (solo cambia importe).
  if (priceId === PRO_PRICE_ID || priceId === PRO_PRICE_ID_YEARLY || priceId === PRO_FOUNDER_PRICE_ID) return "pro";
  return null;
}
