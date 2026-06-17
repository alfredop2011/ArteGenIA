// scripts/stripe-backfill-customer-id.mjs — Backfill profiles.stripe_customer_id
//
// Por qué existe (P0.2): el webhook subscription.deleted/updated cae al
// fallback "buscar customer por email" para usuarios pagados antes de
// que persistiéramos stripe_customer_id. Funciona pero es lento (N+1 a
// Stripe en cada webhook) y falla si el user pagó con otro email.
//
// Este script rellena la columna para todos los profiles pagados:
//   1. SELECT profiles donde plan != 'free' AND stripe_customer_id IS NULL
//   2. Para cada uno: stripe.customers.list({ email }) → elige el customer
//      con subscription activa/trial/past_due. Si no hay activa, el más
//      reciente.
//   3. UPDATE profiles.stripe_customer_id
//
// Default DRY-RUN: solo reporta. --apply para escribir.
//
// Uso:
//   npm run stripe:backfill            # dry-run
//   npm run stripe:backfill:apply      # escribe
//
// Requiere STRIPE_SECRET_KEY + SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL.

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeKey || !supabaseUrl || !serviceKey) {
  console.error("Faltan env vars: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const stripe = new Stripe(stripeKey);
const sb = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`\n=== Stripe customer_id backfill — ${APPLY ? "APPLY" : "DRY-RUN"} ===\n`);

// 1) Profiles pagados sin stripe_customer_id
const { data: profiles, error } = await sb
  .from("profiles")
  .select("id, email, plan")
  .neq("plan", "free")
  .is("stripe_customer_id", null);

if (error) {
  console.error("Error leyendo profiles:", error);
  process.exit(1);
}

if (!profiles || profiles.length === 0) {
  console.log("Ningún perfil pendiente. Nada que hacer.");
  process.exit(0);
}

console.log(`${profiles.length} perfiles a backfillear (plan != free, customer_id NULL)\n`);

const stats = { ok: 0, no_email: 0, no_customer: 0, multi: 0, error: 0 };

for (const p of profiles) {
  if (!p.email) {
    console.log(`  ✗ ${p.id} — sin email en profile`);
    stats.no_email++;
    continue;
  }

  try {
    const customers = await stripe.customers.list({ email: p.email, limit: 10 });
    if (customers.data.length === 0) {
      console.log(`  ✗ ${p.email} (${p.plan}) — ningún customer en Stripe`);
      stats.no_customer++;
      continue;
    }

    // Preferir customer con sub activa/trial/past_due
    let chosen = null;
    for (const c of customers.data) {
      const subs = await stripe.subscriptions.list({ customer: c.id, status: "all", limit: 5 });
      if (subs.data.some((s) => ["active", "trialing", "past_due"].includes(s.status))) {
        chosen = c;
        break;
      }
    }
    // Fallback: el más reciente
    if (!chosen) {
      chosen = customers.data.slice().sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];
    }

    if (customers.data.length > 1) stats.multi++;

    const label = `  ${APPLY ? "→" : "·"} ${p.email} (${p.plan}) → ${chosen.id}${customers.data.length > 1 ? ` (de ${customers.data.length} matches)` : ""}`;
    console.log(label);

    if (APPLY) {
      const { error: updErr } = await sb
        .from("profiles")
        .update({ stripe_customer_id: chosen.id })
        .eq("id", p.id);
      if (updErr) {
        console.error(`     UPDATE falló:`, updErr.message);
        stats.error++;
        continue;
      }
    }
    stats.ok++;
  } catch (e) {
    console.error(`  ✗ ${p.email} — error:`, e.message);
    stats.error++;
  }
}

console.log(`\n=== Resumen ===`);
console.log(`  OK:           ${stats.ok}`);
console.log(`  Sin email:    ${stats.no_email}`);
console.log(`  Sin customer: ${stats.no_customer}`);
console.log(`  Multi-match:  ${stats.multi} (revisar log)`);
console.log(`  Errores:      ${stats.error}`);
if (!APPLY) {
  console.log(`\nDRY-RUN — no se escribió nada. Re-ejecuta con --apply para persistir.`);
}
