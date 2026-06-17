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

/** Resuelve user_id de Supabase a partir de una Subscription / Customer de
 *  Stripe. Fallback chain (P0.2):
 *
 *    1. sub.metadata.supabase_user_id  (preferido — set en checkout)
 *    2. profiles.stripe_customer_id    (persistido en checkout.session.completed)
 *    3. customer.email → profiles.email  (último recurso)
 *
 *  Retorna null si ninguno funciona. El caller DEBE loguear el evento
 *  para reconciliar manualmente — antes esto era un break silencioso
 *  que dejaba Pro gratis tras cancelar.
 */
async function resolveUserIdFromSubscription(
  sub: Stripe.Subscription,
): Promise<string | null> {
  // 1) Metadata directa
  const metaUserId = sub.metadata?.supabase_user_id;
  if (metaUserId) return metaUserId;

  const sb = adminClient();
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

  // 2) Lookup por stripe_customer_id en profiles
  if (customerId) {
    const { data: byCustomer } = await sb
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (byCustomer?.id) return byCustomer.id;
  }

  // 3) Fetch customer.email → profiles.email
  if (customerId) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const email = (customer as any)?.email as string | undefined;
      if (email) {
        const { data: byEmail } = await sb
          .from("profiles")
          .select("id")
          .ilike("email", email)
          .maybeSingle();
        if (byEmail?.id) {
          // Backfill stripe_customer_id para próximos webhooks O(1)
          await sb
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", byEmail.id);
          return byEmail.id;
        }
      }
    } catch (e) {
      console.warn("[stripe-webhook] no pude recuperar customer:", e);
    }
  }

  return null;
}

/** Persiste el stripe_customer_id en profiles para que los siguientes
 *  webhooks puedan resolver por columna en vez de depender de metadata. */
async function persistCustomerId(userId: string, customerId: string) {
  const sb = adminClient();
  const { error } = await sb
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId);
  if (error) {
    console.warn("[stripe-webhook] persist customer_id failed:", error);
  }
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

  // ─── IDEMPOTENCIA ──────────────────────────────────────────────────────
  // Stripe reintenta entregas y un atacante podría reenviar un evento firmado
  // capturado. Registramos cada event.id en stripe_events (PK único). Si ya
  // existe, es un replay → devolvemos 200 sin reprocesar (evita créditos/emails
  // duplicados y corromper el audit trail de credit_transactions).
  {
    const sb = adminClient();
    const { error: dedupErr } = await sb
      .from("stripe_events")
      .insert({ id: event.id, type: event.type });
    if (dedupErr) {
      // 23505 = unique_violation → ya procesado.
      if (dedupErr.code === "23505") {
        console.log(`[stripe-webhook] evento duplicado ignorado: ${event.id}`);
        return NextResponse.json({ received: true, duplicate: true });
      }
      // Otro error de DB: NO procesar a ciegas (podríamos duplicar). Pedimos retry.
      console.error("[stripe-webhook] error registrando idempotencia:", dedupErr);
      return NextResponse.json({ error: "Idempotency store error" }, { status: 500 });
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.supabase_user_id;
        if (!userId) break;
        // P0.2 — Persistir customer_id en profiles para que los siguientes
        // webhooks puedan resolver por columna sin depender de metadata.
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        if (customerId) await persistCustomerId(userId, customerId);
        // Recuperar la subscription para saber qué plan compró (price_id).
        // En checkout.session.completed la subscription es solo un string ID,
        // hay que fetchearla expandida.
        let plan: PlanKey = "pro"; // default si no podemos detectar
        let interval: "monthly" | "yearly" = "monthly";
        if (session.subscription) {
          try {
            const sub = await stripe.subscriptions.retrieve(
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription.id,
            );
            const detected = detectPlanFromSubscription(sub);
            if (detected) plan = detected;
            // Z.23 — detectar interval del price para email upgrade
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const priceInterval = (sub.items?.data?.[0]?.price as any)?.recurring?.interval;
            if (priceInterval === "year") interval = "yearly";
          } catch (e) {
            console.warn("[stripe-webhook] no pude leer subscription:", e);
          }
        }
        // Si todo falla, mira el metadata.requested_plan que pusimos al crear
        if (session.metadata?.requested_plan === "enterprise") plan = "enterprise";
        await updatePlan(userId, plan);
        // Z.23 — Email confirmación upgrade. Fire-and-forget.
        try {
          const email = session.customer_email ?? session.customer_details?.email;
          if (email) {
            const { sendUpgradeProEmail } = await import("@/lib/email");
            void sendUpgradeProEmail(email, plan, interval);
          }
        } catch (e) {
          console.warn("[stripe-webhook] upgrade email skip:", e);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(sub);
        if (userId) {
          await updatePlan(userId, "free");
        } else {
          // P0.2 — antes esto era break silencioso → Pro gratis tras cancelar
          console.error(
            "[stripe-webhook] subscription.deleted SIN userId resoluble — revisar manualmente",
            { sub_id: sub.id, customer: sub.customer },
          );
        }
        // Z.23 — Email cancel survey. Fire-and-forget. Necesitamos el email
        // del customer; lo recuperamos vía API porque sub solo tiene el ID.
        try {
          const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
          if (customerId) {
            const customer = await stripe.customers.retrieve(customerId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const email = (customer as any)?.email as string | undefined;
            if (email) {
              const { sendCancelSurveyEmail } = await import("@/lib/email");
              void sendCancelSurveyEmail(email);
            }
          }
        } catch (e) {
          console.warn("[stripe-webhook] cancel email skip:", e);
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserIdFromSubscription(sub);
        if (!userId) {
          console.error(
            "[stripe-webhook] subscription.updated SIN userId resoluble — revisar manualmente",
            { sub_id: sub.id, customer: sub.customer, status: sub.status },
          );
          break;
        }
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
