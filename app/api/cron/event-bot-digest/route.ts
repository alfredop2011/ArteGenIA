import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCron } from "@/lib/cronAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * /api/cron/event-bot-digest — avisos proactivos del bot a organizadores.
 *
 * Diario: a quien tiene un evento HOY o MAÑANA (por Telegram) le manda un
 * recordatorio con su rendimiento (vistas/clics), un aviso si falta algún dato
 * y una invitación MUY sutil a gestionarlo en su panel. Respeta el silencio
 * (bot_subscribers.muted). Identifica al organizador por su chat (submitter_ref).
 *
 * Vercel inyecta Authorization: Bearer CRON_SECRET.
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://artegenia.com";

async function tgSend(chatId: string, text: string) {
  if (!TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}

function isoPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type Ev = {
  submitter_ref: string; submitter_name: string | null; title: string; event_date: string;
  event_time: string; venue: string; price: number | null; ticket_url: string | null;
  view_count: number; click_count: number; organizer_id: string | null; claim_token: string | null;
};

export async function GET(req: NextRequest) {
  if (!isAuthorizedCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  if (!TOKEN) return NextResponse.json({ ok: true, note: "sin TELEGRAM_BOT_TOKEN" });

  const today = isoPlus(0);
  const tomorrow = isoPlus(1);

  // Eventos de hoy/mañana enviados por Telegram (publicados).
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("submitter_ref,submitter_name,title,event_date,event_time,venue,price,ticket_url,view_count,click_count,organizer_id,claim_token")
    .eq("submitter_channel", "telegram")
    .eq("status", "published")
    .in("event_date", [today, tomorrow]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const evs = (data as Ev[]) ?? [];
  if (evs.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  // Refs silenciados.
  const { data: subs } = await supabaseAdmin.from("bot_subscribers").select("ref,muted").eq("channel", "telegram");
  const muted = new Set((subs ?? []).filter((s) => s.muted).map((s) => s.ref));

  // Agrupar por organizador.
  const byRef = new Map<string, Ev[]>();
  for (const e of evs) {
    if (muted.has(e.submitter_ref)) continue;
    if (!byRef.has(e.submitter_ref)) byRef.set(e.submitter_ref, []);
    byRef.get(e.submitter_ref)!.push(e);
  }

  let sent = 0;
  for (const [ref, list] of byRef) {
    const name = list[0].submitter_name || "";
    const lines = list.map((e) => {
      const when = e.event_date === today ? "HOY" : "mañana";
      const perf = `👁 ${e.view_count} · 🛒 ${e.click_count}`;
      const tip = !e.ticket_url
        ? " — sin link de compra; añade uno o di cómo asistir"
        : e.click_count === 0 && e.view_count > 5
        ? " — tiene vistas pero 0 clics; quizá revisa precio/horario"
        : "";
      return `• <b>${e.title}</b> — ${when} ${e.event_time} · ${e.venue}\n   ${perf}${tip}`;
    });
    const needsPrice = list.some((e) => e.price == null);
    const claimToken = list.find((e) => e.claim_token)?.claim_token;
    const unregistered = list.some((e) => !e.organizer_id);

    const msg =
      `👋 ${name ? name + ", " : ""}recordatorio de tu agenda:\n\n` +
      lines.join("\n") +
      (needsPrice ? `\n\n⚠️ A algún evento le falta el <b>precio</b> — respóndeme aquí y lo añado.` : "") +
      (unregistered && claimToken
        ? `\n\n✨ Gestiónalos y planifica el año en tu panel:\n${APP_URL}/organizador?claim=${claimToken}`
        : "") +
      `\n\n<i>Si no quieres estos avisos, escríbeme "silenciar".</i>`;

    await tgSend(ref, msg);
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
