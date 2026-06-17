import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendLowCreditsEmail } from "@/lib/email";
import { daysUntilReset } from "@/lib/credits";
import { isAuthorizedCron } from "@/lib/cronAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/low-credits — Vercel cron diario (10am UTC).
 *
 * Detecta usuarios con balance < 20% del monthly_grant que aún no han
 * recibido aviso este mes. Envía email "Te quedan X créditos" y marca
 * la flag low_credits_emailed_at para no spamear.
 *
 * Auth via CRON_SECRET header — sin secret, 403.
 *
 * Flag reset: cuando llega el día 1 (cron reset-credits), borramos
 * low_credits_emailed_at para que en el próximo mes se pueda enviar otra vez.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Lee TODOS los user_credits — filtramos en JS porque PostgREST no
    // soporta comparar 2 columnas (balance < monthly_grant * 0.2) en filter.
    const { data: rows, error } = await supabaseAdmin
      .from("user_credits")
      .select("user_id, balance, monthly_grant, reset_at, low_credits_emailed_at");

    if (error) {
      console.error("[cron low-credits] query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let sent = 0;
    let skipped = 0;
    const candidates = (rows ?? []).filter(r => r.balance < r.monthly_grant * 0.2);

    for (const row of candidates) {
      // Skip si ya se avisó este mes (después del último reset)
      if (row.low_credits_emailed_at) {
        const last = new Date(row.low_credits_emailed_at);
        const resetDate = new Date(row.reset_at);
        // Si la fecha de aviso es POSTERIOR al último reset, ya se notificó
        const lastResetDate = new Date(resetDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (last > lastResetDate) {
          skipped++;
          continue;
        }
      }
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
      const email = authUser?.user?.email;
      if (!email) { skipped++; continue; }

      try {
        await sendLowCreditsEmail(
          email,
          row.balance,
          row.monthly_grant,
          daysUntilReset(row.reset_at),
        );
        sent++;
        // Marcar como avisado (best effort — si la columna no existe, log warning)
        await supabaseAdmin
          .from("user_credits")
          .update({ low_credits_emailed_at: new Date().toISOString() })
          .eq("user_id", row.user_id);
      } catch (e) {
        console.error(`[cron low-credits] fallo para ${email}:`, e);
      }
    }

    return NextResponse.json({ ok: true, sent, skipped, total: candidates.length });
  } catch (e) {
    console.error("[cron low-credits] error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
