import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

export const runtime = "nodejs";
// Webhooks de Stripe pueden tener picos de carga — no cachear
export const dynamic = "force-dynamic";

/**
 * /api/stripe/webhook — Recibe eventos de Stripe y actualiza la BD.
 *
 * Eventos manejados:
 * - checkout.session.completed: usuario pagó → marcar profile.plan = "pro"
 * - customer.subscription.deleted: cancelación → volver a "free"
 * - customer.subscription.updated: cambio de plan → actualizar
 *
 * SEGURIDAD: verificamos firma Stripe en cada request. Sin esto, cualquiera
 * podría enviar POST falsos a este endpoint y darse acceso Pro gratis.
 *
 * SETUP: en Stripe Dashboard → Developers → Webhooks → Add endpoint
 * URL: https://artegenia.vercel.app/api/stripe/webhook
 * Events: checkout.session.completed, customer.subscription.*
 * → Copia el Signing secret (whsec_...) y pega en STRIPE_WEBHOOK_SECRET
 */

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

/** Cliente admin (service role) para escribir en profiles bypassing RLS.
 *  El webhook NO tiene contexto de auth — viene de Stripe servers. */
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function updatePlan(userId: string, plan: "free" | "pro") {
  const sb = adminClient();
  const { error } = await sb
    .from("profiles")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.error("[stripe-webhook] update plan failed:", error);
  else console.log(`[stripe-webhook] user ${userId} → plan=${plan}`);
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.warn("[stripe-webhook] STRIPE_WEBHOOK_SECRET no configurado");
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Falta stripe-signature" }, { status: 400 });
  }

  // Importante: Stripe necesita el RAW body para verificar la firma.
  // No usar req.json() — eso parsea y rompe la verificación.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.warn("[stripe-webhook] firma inválida:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Firma invalida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.supabase_user_id;
        if (userId) await updatePlan(userId, "pro");
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        // Obtener el customer y de ahí el email para buscar el user
        // O usar metadata si la guardamos al crear
        const userId = sub.metadata?.supabase_user_id;
        if (userId) await updatePlan(userId, "free");
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;
        // Si la suscripción está activa, asegurar plan=pro
        if (sub.status === "active" || sub.status === "trialing") {
          await updatePlan(userId, "pro");
        } else if (sub.status === "canceled" || sub.status === "unpaid" || sub.status === "incomplete_expired") {
          await updatePlan(userId, "free");
        }
        break;
      }
      default:
        // Otros eventos los ignoramos silenciosamente (Stripe espera 200)
        console.log(`[stripe-webhook] evento no manejado: ${event.type}`);
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] error procesando evento:", err);
    return NextResponse.json({ error: "Error procesando" }, { status: 500 });
  }
}
