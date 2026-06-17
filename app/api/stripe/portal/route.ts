import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/stripe/portal — Crea una Billing Portal Session para que el usuario
 * gestione su suscripción sin escribirnos: cancelar, cambiar plan, actualizar
 * método de pago, descargar facturas, etc.
 *
 * Flujo:
 * 1. Usuario tap "Gestionar suscripción" en /pricing (si es Pro/Enterprise)
 * 2. POST aquí → buscamos su Stripe Customer por email
 * 3. Creamos Billing Portal Session → devolvemos URL
 * 4. Cliente redirige a billing.stripe.com/p/...
 * 5. Al volver, redirige a /pricing
 *
 * REQUIERE: en Stripe Dashboard → Settings → Billing → Customer portal,
 * activar el portal y configurar qué pueden hacer (cancelar, swap plans, etc).
 * https://dashboard.stripe.com/test/settings/billing/portal
 *
 * Resolución del customer (P0.2 — fallback chain):
 *   1. profiles.stripe_customer_id (persistido en checkout.session.completed)
 *   2. stripe.customers.list({ email }) — N+1, último recurso
 *
 * Antes solo usaba (2), lo cual fallaba si el user pagó con otro email
 * (común en organizaciones) y hacía N peticiones a Stripe en cada llamada.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Inicia sesion" }, { status: 401 });
    }

    let customerId: string | null = null;

    // 1) Fast path — usar el customer_id persistido en profiles
    const sbAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: profile } = await sbAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id;
    }

    // 2) Fallback: list por email (caro, N+1 contra Stripe). Solo si el
    //    user pagó antes de que persistiéramos customer_id.
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      if (customers.data.length === 0) {
        return NextResponse.json(
          { error: "No encontramos tu suscripción. ¿Pagaste con otro email?" },
          { status: 404 },
        );
      }
      for (const c of customers.data) {
        const subs = await stripe.subscriptions.list({
          customer: c.id,
          status: "all",
          limit: 1,
        });
        if (subs.data.some((s) => s.status === "active" || s.status === "trialing" || s.status === "past_due")) {
          customerId = c.id;
          break;
        }
      }
      if (!customerId) {
        customerId = customers.data
          .slice()
          .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0].id;
      }
      // Backfill para próximas llamadas
      if (customerId) {
        await sbAdmin
          .from("profiles")
          .update({ stripe_customer_id: customerId })
          .eq("id", user.id);
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe-portal]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    // Mensaje claro si el portal no está configurado en Stripe Dashboard
    if (msg.includes("No configuration provided") || msg.includes("default configuration")) {
      return NextResponse.json(
        {
          error:
            "Portal no configurado en Stripe. Ve a Dashboard → Settings → Billing → Customer portal y actívalo.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
