import { NextRequest, NextResponse } from "next/server";
import { stripe, planFromPriceId, type PlanKey } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { MONTHLY_GRANT } from "@/lib/credits";

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

async function updatePlan(userId: string, plan: "free" | PlanKey) {
  const sb = adminClient();
  const { error } = await sb
    .from("profiles")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) console.error("[stripe-webhook] update plan failed:", error);
  else console.log(`[stripe-webhook] user ${userId} → plan=${plan}`);

  // Fase Z.5 — sincronizar créditos al cambio de plan.
  // Estrategia:
  //   UPGRADE (free → pro|enterprise): subir balance al cap del nuevo plan
  //     si tenía menos. monthly_grant = nuevo grant para próximos resets.
  //   DOWNGRADE (pro|enterprise → free): bajar balance al cap del nuevo plan
  //     (= 10). El user pierde el exceso. Es lo estándar SaaS (Stripe Billing).
  //
  // Idempotente: si el plan ya estaba aplicado, el UPDATE no hace nada.
  await updateCreditsForPlan(userId, plan);
}

/** Sincroniza user_credits.monthly_grant + balance con el plan actual.
 *
 *  - Upgrade (free→pro): balance = max(balance, 100), grant = 100
 *  - Downgrade (pro→free): balance = LEAST(balance, 10), grant = 10
 *  - Si la row no existe (improbable, hay trigger en signup), la crea.
 *
 *  Errores se loguean pero NO bloquean el webhook — el plan ya quedó
 *  actualizado en profiles, y un cron correctivo podría sincronizar
 *  después (no implementado todavía, OK).
 */
async function updateCreditsForPlan(userId: string, plan: "free" | PlanKey) {
  const sb = adminClient();
  const newGrant = MONTHLY_GRANT[plan] ?? 10;

  // Ensure existence (idempotente)
  const { error: insertErr } = await sb
    .from("user_credits")
    .upsert({ user_id: userId, balance: newGrant, monthly_grant: newGrant }, {
      onConflict: "user_id",
      ignoreDuplicates: true,
    });
  if (insertErr) {
    console.warn("[stripe-webhook] upsert user_credits failed:", insertErr);
  }

  // Estrategia por escenario:
  //  - Upgrade: balance = GREATEST(balance, newGrant)
  //  - Downgrade: balance = LEAST(balance, newGrant)
  // SQL: para hacerlo atómico usamos un RAW filter. Aquí lo simplificamos
  // leyendo + actualizando porque no hay race condition (webhook único).
  const { data: currentRow } = await sb
    .from("user_credits")
    .select("balance, monthly_grant")
    .eq("user_id", userId)
    .maybeSingle();

  if (!currentRow) {
    console.warn("[stripe-webhook] user_credits row missing tras upsert:", userId);
    return;
  }

  const currentBalance = currentRow.balance;
  const currentGrant = currentRow.monthly_grant;
  const isUpgrade = newGrant > currentGrant;
  const isDowngrade = newGrant < currentGrant;

  let newBalance = currentBalance;
  if (isUpgrade) {
    newBalance = Math.max(currentBalance, newGrant);
  } else if (isDowngrade) {
    newBalance = Math.min(currentBalance, newGrant);
  }

  const { error: updErr } = await sb
    .from("user_credits")
    .update({
      monthly_grant: newGrant,
      balance: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updErr) {
    console.error("[stripe-webhook] update credits failed:", updErr);
    return;
  }

  // Audit trail
  await sb.from("credit_transactions").insert({
    user_id: userId,
    amount: newBalance - currentBalance,
    reason: `plan_change:${plan}`,
    module: null,
    balance_after: newBalance,
    meta: {
      from_plan: currentGrant === MONTHLY_GRANT.free ? "free" :
                 currentGrant === MONTHLY_GRANT.pro ? "pro" :
                 currentGrant === MONTHLY_GRANT.enterprise ? "enterprise" : "unknown",
      to_plan: plan,
      from_grant: currentGrant,
      to_grant: newGrant,
    },
  });

  console.log(
    `[stripe-webhook] credits sync: ${userId} ${currentGrant}→${newGrant} grant, ${currentBalance}→${newBalance} balance`,
  );
}

/** Dada una subscription Stripe, devuelve qué plan (pro/enterprise/null)
 *  comparando el price_id del primer item con los IDs configurados.
 *  Fallback a metadata.requested_plan si por algún motivo no matchea. */
function detectPlanFromSubscription(sub: Stripe.Subscription): PlanKey | null {
  const priceId = sub.items?.data?.[0]?.price?.id;
  if (priceId) {
    const matched = planFromPriceId(priceId);
    if (matched) return matched;
  }
  const fallback = sub.metadata?.requested_plan;
  if (fallback === "pro" || fallback === "enterprise") return fallback;
  return null;
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
        if (!userId) break;
        // Recuperar la subscription para saber qué plan compró (price_id).
        // En checkout.session.completed la subscription es solo un string ID,
        // hay que fetchearla expandida.
        let plan: PlanKey = "pro"; // default si no podemos detectar
        if (session.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id,
            );
            const detected = detectPlanFromSubscription(sub);
            if (detected) plan = detected;
          } catch (e) {
            console.warn("[stripe-webhook] no pude leer subscription:", e);
          }
        }
        // Si todo falla, mira el metadata.requested_plan que pusimos al crear
        if (session.metadata?.requested_plan === "enterprise") plan = "enterprise";
        await updatePlan(userId, plan);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (userId) await updatePlan(userId, "free");
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;
        // Activa: plan según price_id (pro o enterprise). Cancelada: free.
        if (sub.status === "active" || sub.status === "trialing") {
          const detected = detectPlanFromSubscription(sub) ?? "pro";
          await updatePlan(userId, detected);
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
