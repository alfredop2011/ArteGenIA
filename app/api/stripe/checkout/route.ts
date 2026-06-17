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

    // Acepta body { plan: "pro" | "enterprise", interval: "month" | "year", next?: string }
    // Default: pro + month (back-compat con clientes antiguos sin interval).
    let plan: PlanKey = "pro";
    let interval: "month" | "year" = "month";
    let next: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      if (body?.plan === "enterprise") plan = "enterprise";
      if (body?.interval === "year") interval = "year";
      // `next`: URL interna a la que volver tras pagar. Solo rutas relativas
      // empezando por "/" para evitar open redirect.
      if (typeof body?.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//")) {
        next = body.next;
      }
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

    const priceId = priceIdFor(plan, interval);
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
      metadata: { supabase_user_id: user.id, requested_plan: plan, interval },
      subscription_data: {
        metadata: { supabase_user_id: user.id, requested_plan: plan, interval },
        ...(useTrial ? { trial_period_days: trialDays } : {}),
      },
      success_url: `${baseUrl}/pricing?success=1&plan=${plan}&interval=${interval}&session_id={CHECKOUT_SESSION_ID}${next ? `&next=${encodeURIComponent(next)}` : ""}`,
      cancel_url: `${baseUrl}/pricing?canceled=1${next ? `&next=${encodeURIComponent(next)}` : ""}`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      // Cumplimiento UE/España (Art. 102-103 TRLGDCU): el user debe aceptar
      // expresamente los Términos antes de pagar. Sin este consentimiento
      // explícito + el reconocimiento de pérdida del derecho de desistimiento
      // (sección 12 de /terminos), nuestra excepción al desistimiento no
      // sería oponible legalmente. Stripe muestra el checkbox automático
      // con link a la política configurada en Dashboard → Settings →
      // Branding → Public details → Terms of service URL.
      consent_collection: { terms_of_service: "required" },
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
