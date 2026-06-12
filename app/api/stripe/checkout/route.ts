import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { stripe, PRO_PRICE_ID } from "@/lib/stripe";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/stripe/checkout — Crea Checkout Session y devuelve URL para redirect.
 *
 * Flujo:
 * 1. Usuario tap "Upgrade a Pro" en /pricing o modal upgrade
 * 2. POST aquí → crea Stripe Checkout Session vinculada a su user_id
 * 3. Cliente recibe { url } y redirige a checkout.stripe.com
 * 4. Tras pagar exitoso → Stripe redirige a /pricing?success=true
 * 5. Stripe envía webhook a /api/stripe/webhook
 * 6. Webhook actualiza profiles.plan = "pro"
 *
 * Idempotencia: client_reference_id = user.id permite al webhook saber qué
 * usuario actualizar sin necesidad de mantener mapping local.
 */

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Inicia sesion" }, { status: 401 });
    }
    if (!PRO_PRICE_ID) {
      return NextResponse.json({ error: "Plan Pro no configurado" }, { status: 503 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
      customer_email: user.email,
      // Vinculamos la session con nuestro user.id — el webhook lo lee para
      // saber qué profile actualizar.
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      success_url: `${baseUrl}/pricing?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
      allow_promotion_codes: true,
      // Reusar mismo customer si ya pago antes (evita duplicados)
      billing_address_collection: "auto",
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe no devolvió URL" }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe-checkout]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
