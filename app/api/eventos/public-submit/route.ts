import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { seriesKeyFromTitle } from "@/lib/eventSeries";
import { publicSubmitKeyOk } from "@/lib/eventSubmit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * /api/eventos/public-submit — PÚBLICO (sin login). Publica un evento enviado
 * desde la página /subir (link compartible). Inserta con source='web' y un
 * claim_token, para que quien lo subió pueda reclamarlo si abre cuenta.
 *
 * Misma protección por clave que public-extract (EVENT_SUBMIT_KEY).
 */

const VALID_CATS = ["fiesta", "conciertos", "festival", "clases", "club", "corporativo", "social", "teatro"];
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://artegenia.com";

function clean(v: unknown, max = 120): string {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    if (!publicSubmitKeyOk(req)) return NextResponse.json({ error: "Enlace no válido" }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

    const title = clean(body.title);
    const event_date = clean(body.event_date, 10);
    if (!title) return NextResponse.json({ error: "Falta el título" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) return NextResponse.json({ error: "Falta la fecha (o formato inválido)" }, { status: 400 });

    const category = VALID_CATS.includes(body.category) ? body.category : "fiesta";
    const time = /^\d{1,2}:\d{2}$/.test(clean(body.event_time, 5)) ? clean(body.event_time, 5) : "20:00";
    const price =
      body.price === "" || body.price == null
        ? null
        : Number.isFinite(Number(body.price))
        ? Math.max(0, Math.round(Number(body.price)))
        : null;
    const ticket_url = typeof body.ticket_url === "string" && body.ticket_url.startsWith("http") ? body.ticket_url.slice(0, 400) : null;
    const email = typeof body.submitter_email === "string" && body.submitter_email.includes("@") ? clean(body.submitter_email, 160) : null;
    const claimToken = crypto.randomUUID();

    const { data, error } = await supabaseAdmin
      .from("events")
      .insert({
        organizer_id: null,
        source: "organizer", // el CHECK de events.source solo admite organizer/telegram/whatsapp/auto
        status: "published",
        submitter_channel: "web",
        submitter_ref: email || claimToken,
        submitter_name: clean(body.submitter_name, 80) || null,
        submitter_email: email,
        claim_token: claimToken,
        series_key: seriesKeyFromTitle(title),
        title,
        description: body.description ? clean(body.description, 300) : null,
        event_date,
        event_time: time.length === 4 ? `0${time}` : time,
        country: "es",
        city: (clean(body.city, 40) || "madrid").toLowerCase(),
        venue: clean(body.venue) || "Por confirmar",
        neighborhood: body.neighborhood ? clean(body.neighborhood, 80) : null,
        category,
        price,
        price_info: body.price_info ? clean(body.price_info) : null,
        has_online_sale: !!ticket_url,
        ticket_url,
        image_url: typeof body.image_url === "string" && body.image_url.startsWith("http") ? body.image_url : null,
        image_key: body.image_key ? clean(body.image_key, 200) : null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[eventos/public-submit]", error.message);
      return NextResponse.json({ error: "No se pudo publicar. Inténtalo de nuevo." }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      publicUrl: `${APP_URL}/eventos?evento=${data.id}`,
      claimUrl: `${APP_URL}/organizador?claim=${claimToken}`,
    });
  } catch (err) {
    console.error("[eventos/public-submit]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
