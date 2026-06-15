import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { stripe, priceIdFor, type PlanKey } from "@/lib/stripe";

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

    // Acepta body { plan: "pro" | "enterprise" }. Default: "pro" (back-compat).
    let plan: PlanKey = "pro";
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.plan === "enterprise") plan = "enterprise";
    } catch {}

    // Fase T.11 — Enterprise temporalmente bloqueado (mailto teaser en
    // /pricing) hasta tener: multi-user workspace, Brand Kit, plantillas
    // exclusivas, factura con IVA. Vender hoy = riesgo de chargebacks +
    // denuncia por publicidad engañosa. Reactivar quitando este bloque.
    if (plan === "enterprise") {
      return NextResponse.json(
        { error: "Enterprise estará disponible próximamente. Reserva tu plaza en /pricing." },
        { status: 403 },
      );
    }

    const priceId = priceIdFor(plan);
    if (!priceId) {
      return NextResponse.json(
        { error: `Plan ${plan} no configurado` },
        { status: 503 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    // Trial gratuito en días para nuevos suscriptores. Stripe requiere
    // que el método de pago se valide al crear la suscripción (autorización
    // sin cargo) — así nos aseguramos que al final del trial sí podemos
    // cobrar sin perder al usuario. STRIPE_TRIAL_DAYS=0 desactiva el trial.
    const trialDays = Number.parseInt(process.env.STRIPE_TRIAL_DAYS ?? "30", 10);
    const useTrial = !Number.isNaN(trialDays) && trialDays > 0;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      // Vinculamos la session con nuestro user.id — el webhook lo lee para
      // saber qué profile actualizar. También pasamos el plan deseado en
      // metadata como backup (el webhook prefiere mirar el price_id real).
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id, requested_plan: plan },
      subscription_data: {
        metadata: { supabase_user_id: user.id, requested_plan: plan },
        ...(useTrial ? { trial_period_days: trialDays } : {}),
      },
      success_url: `${baseUrl}/pricing?success=1&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
      allow_promotion_codes: true,
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
