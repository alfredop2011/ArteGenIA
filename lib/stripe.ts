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

/** Price ID del plan Pro recurrente (mensual). Crear en Stripe Dashboard:
 *  Products → Add product → "ArteGenIA Pro" → Add price ($9.99/month) →
 *  copiar Price ID (empieza por price_...) y pegarlo en .env. */
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
