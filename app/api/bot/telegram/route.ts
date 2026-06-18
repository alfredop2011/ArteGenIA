import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadToR2, makeKey } from "@/lib/r2";
import { extractEventFromImage } from "@/lib/extractEvent";
import { seriesKeyFromTitle } from "@/lib/eventSeries";
import { converse, type BrainEvent } from "@/lib/botBrain";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * /api/bot/telegram — webhook del bot de Telegram.
 *
 * Flujo: el organizador (SIN cuenta) manda el flyer al bot →
 *   1. Descargamos la foto de Telegram y la subimos a R2.
 *   2. Claude (visión) extrae fecha/lugar/precio/categoría del flyer.
 *   3. Insertamos el evento como PUBLICADO (sin organizer_id), atado a su
 *      chat de Telegram, con un claim_token estable.
 *   4. Respondemos con confirmación + enlace para abrir cuenta y reclamar.
 *
 * Inserta con supabaseAdmin (service role) porque el remitente no está
 * autenticado. Robusto si faltan envs (no rompe; responde 200 a Telegram).
 *
 * Setup: crear bot con @BotFather → TELEGRAM_BOT_TOKEN. Registrar webhook:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/bot/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
 */

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://artegenia.com";

async function tgSend(chatId: number | string, text: string) {
  if (!TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}

// Descarga la foto de mayor resolución que mandó el usuario.
async function tgDownloadPhoto(fileId: string): Promise<{ buffer: Buffer; mediaType: string } | null> {
  if (!TOKEN) return null;
  const meta = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`).then((r) => r.json());
  const path: string | undefined = meta?.result?.file_path;
  if (!path) return null;
  const res = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${path}`);
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  const mediaType = path.endsWith(".png") ? "image/png" : path.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return { buffer, mediaType };
}

// Reutiliza el claim_token del remitente si ya envió eventos antes (para que
// reclame TODOS de una sola vez), o genera uno nuevo.
async function claimTokenFor(ref: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from("events")
    .select("claim_token")
    .eq("submitter_channel", "telegram")
    .eq("submitter_ref", ref)
    .not("claim_token", "is", null)
    .limit(1)
    .maybeSingle();
  return data?.claim_token ?? crypto.randomUUID();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Email que ya nos dio este chat (para reusarlo y no volver a pedirlo).
async function emailFor(ref: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("events")
    .select("submitter_email")
    .eq("submitter_channel", "telegram")
    .eq("submitter_ref", ref)
    .not("submitter_email", "is", null)
    .limit(1)
    .maybeSingle();
  return data?.submitter_email ?? null;
}

// Silencia / reactiva los avisos del remitente.
async function setMuted(ref: string, muted: boolean) {
  await supabaseAdmin
    .from("bot_subscribers")
    .upsert({ channel: "telegram", ref, muted }, { onConflict: "channel,ref" });
}

// Guarda el email en todos los eventos de ese remitente.
async function saveEmail(ref: string, email: string) {
  await supabaseAdmin
    .from("events")
    .update({ submitter_email: email })
    .eq("submitter_channel", "telegram")
    .eq("submitter_ref", ref);
}

// Interpreta un texto como precio: "gratis" → 0; un número → ese precio;
// varios números → precio "desde" (mínimo) + detalle. null si no parece precio.
function parsePriceText(text: string): { price: number; info: string | null } | null {
  const t = text.toLowerCase();
  if (/(gratis|gratuita|libre|free|entrada libre)/.test(t)) return { price: 0, info: null };
  const nums = (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => parseFloat(n.replace(",", ".")));
  if (nums.length === 0) return null;
  if (nums.length === 1) return { price: nums[0], info: null };
  return { price: Math.min(...nums), info: text.trim().slice(0, 120) };
}

// Completa el precio en el último evento del remitente que lo tenga vacío.
async function fillLatestMissingPrice(ref: string, price: number, info: string | null) {
  const { data: ev } = await supabaseAdmin
    .from("events")
    .select("id,title")
    .eq("submitter_channel", "telegram")
    .eq("submitter_ref", ref)
    .is("price", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!ev) return null;
  await supabaseAdmin.from("events").update({ price, price_info: info }).eq("id", ev.id);
  return ev.title as string;
}

// Eventos del remitente, para dar contexto al "cerebro" (incluye analítica).
// Si faltan columnas de analítica (migración 2026_06_18e sin aplicar), reintenta
// sin ellas para que el bot SIEMPRE conozca los eventos del organizador.
async function loadBrainEvents(ref: string): Promise<BrainEvent[]> {
  type Row = {
    id: string; title: string; event_date: string; event_time: string; venue: string;
    price: number | null; status: string; view_count?: number; click_count?: number; ticket_url: string | null;
  };
  const full = await supabaseAdmin
    .from("events")
    .select("id,title,event_date,event_time,venue,price,status,view_count,click_count,ticket_url")
    .eq("submitter_channel", "telegram")
    .eq("submitter_ref", ref)
    .order("event_date", { ascending: true })
    .limit(40);
  // Fallback sin columnas de analítica (migración 2026_06_18e sin aplicar).
  const basic = full.error
    ? await supabaseAdmin
        .from("events")
        .select("id,title,event_date,event_time,venue,price,status,ticket_url")
        .eq("submitter_channel", "telegram")
        .eq("submitter_ref", ref)
        .order("event_date", { ascending: true })
        .limit(40)
    : null;
  const rows = (full.error ? basic?.data : full.data) as Row[] | null;
  return (rows ?? []).map((r) => ({
    id: r.id, title: r.title, event_date: r.event_date, event_time: r.event_time, venue: r.venue,
    price: r.price, status: r.status, viewCount: r.view_count ?? 0, clickCount: r.click_count ?? 0,
    hasLink: !!r.ticket_url,
  }));
}

// Ejecutor de acciones del cerebro — SIEMPRE limitado a los eventos de `ref`.
function makeRunTool(ref: string) {
  return async (name: string, input: Record<string, unknown>): Promise<string> => {
    // Búsqueda PÚBLICA de eventos (de cualquier organizador). No requiere id.
    if (name === "buscar_eventos") {
      let q = supabaseAdmin
        .from("events")
        .select("title,event_date,event_time,venue,city,price,status")
        .eq("status", "published")
        .order("event_date", { ascending: true })
        .limit(20);
      if (typeof input.ciudad === "string" && input.ciudad.trim()) q = q.eq("city", input.ciudad.toLowerCase().trim());
      if (typeof input.desde === "string") q = q.gte("event_date", input.desde);
      if (typeof input.hasta === "string") q = q.lte("event_date", input.hasta);
      const { data } = await q;
      const rows = (data as { title: string; event_date: string; event_time: string; venue: string; city: string; price: number | null }[]) ?? [];
      if (rows.length === 0) return "No hay eventos públicos para esos filtros.";
      return rows
        .map((e) => `- "${e.title}" · ${e.event_date} ${e.event_time} · ${e.venue} (${e.city}) · ${e.price == null ? "consultar" : e.price === 0 ? "gratis" : e.price + "€"}`)
        .join("\n");
    }

    // Preferencia de avisos (no requiere id).
    if (name === "silenciar_avisos" || name === "activar_avisos") {
      const muted = name === "silenciar_avisos";
      await supabaseAdmin
        .from("bot_subscribers")
        .upsert({ channel: "telegram", ref, muted }, { onConflict: "channel,ref" });
      return muted ? "Avisos silenciados. No te escribiré salvo que me hables." : "Avisos reactivados.";
    }

    const id = typeof input.id === "string" ? input.id : "";
    if (!id) return "Falta el id del evento.";
    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("id,title")
      .eq("id", id)
      .eq("submitter_channel", "telegram")
      .eq("submitter_ref", ref)
      .maybeSingle();
    if (!ev) return "No encontré ese evento entre los tuyos.";

    if (name === "cancelar_evento") {
      await supabaseAdmin.from("events").update({ status: "cancelled" }).eq("id", id);
      return `Cancelado: "${ev.title}".`;
    }
    if (name === "reactivar_evento") {
      await supabaseAdmin.from("events").update({ status: "published" }).eq("id", id);
      return `Reactivado: "${ev.title}".`;
    }
    if (name === "borrar_evento") {
      await supabaseAdmin.from("events").delete().eq("id", id).eq("submitter_ref", ref);
      return `Borrado: "${ev.title}".`;
    }
    if (name === "actualizar_evento") {
      const patch: Record<string, unknown> = {};
      if (typeof input.event_time === "string") patch.event_time = input.event_time;
      if (typeof input.event_date === "string") patch.event_date = input.event_date;
      if (typeof input.venue === "string") patch.venue = input.venue;
      if (typeof input.title === "string") { patch.title = input.title; patch.series_key = seriesKeyFromTitle(input.title); }
      if (typeof input.price === "number") patch.price = input.price;
      if (typeof input.price_info === "string") patch.price_info = input.price_info;
      if (Object.keys(patch).length === 0) return "No indicaste qué cambiar.";
      await supabaseAdmin.from("events").update(patch).eq("id", id);
      return `Actualizado: "${ev.title}".`;
    }
    return "No sé hacer eso.";
  };
}

export async function POST(req: NextRequest) {
  // Verificación del secreto del webhook (si está configurado).
  if (WEBHOOK_SECRET && req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!TOKEN) {
    console.warn("[bot/telegram] Falta TELEGRAM_BOT_TOKEN");
    return NextResponse.json({ ok: true }); // 200 para que Telegram no reintente
  }

  try {
    const update = await req.json();
    const msg = update?.message ?? update?.channel_post;
    const chatId: number | undefined = msg?.chat?.id;
    if (!chatId) return NextResponse.json({ ok: true });

    // Nombre del remitente (para saludarle e identificarlo aunque no tenga cuenta).
    const fromName: string = msg.from?.first_name || msg.from?.username || "";
    const hi = fromName ? `${fromName}, ` : "";

    // Texto sin foto: comandos, completar datos (email/precio) o conversación.
    if (!msg.photo) {
      const text: string = (msg.text || "").trim();

      // 0) Comandos del menú (/start, /ayuda, /silenciar, …). Quita @NombreBot.
      const cmd = text.toLowerCase().replace(/@\w+\s*$/, "").trim();
      const intro =
        `👋 ¡Hola${fromName ? " " + fromName : ""}! Soy la agenda de eventos de ArteGenIA.\n\n` +
        `📸 <b>Organizadores</b>: mándame el flyer (foto) y publico tu evento solo — leo fecha, lugar y precio. Gratis.\n` +
        `🔎 <b>¿Buscas plan?</b> Pregúntame "¿qué hay en Madrid hoy?".\n\n` +
        `También edito, cancelo o te digo cómo va tu evento. Escríbeme 👇`;
      if (cmd === "/start" || cmd === "/ayuda") {
        await tgSend(chatId, intro);
        return NextResponse.json({ ok: true });
      }
      if (cmd === "/silenciar") {
        await setMuted(String(chatId), true);
        await tgSend(chatId, "🔕 Avisos silenciados. No te escribiré salvo que me hables. Usa /activar para reactivarlos.");
        return NextResponse.json({ ok: true });
      }
      if (cmd === "/activar") {
        await setMuted(String(chatId), false);
        await tgSend(chatId, "🔔 Avisos reactivados.");
        return NextResponse.json({ ok: true });
      }
      // /eventos y /miseventos → los resuelve el cerebro con una intención clara.
      const brainText =
        cmd === "/eventos" ? "¿Qué eventos hay esta semana?" : cmd === "/miseventos" ? "Muéstrame mis eventos" : text;

      // 1) Email → contacto.
      if (EMAIL_RE.test(text)) {
        await saveEmail(String(chatId), text);
        await tgSend(chatId, `✉️ ¡Anotado, ${fromName || "gracias"}! Te avisaré en <b>${text}</b> si a algún evento le falta algún dato.`);
        return NextResponse.json({ ok: true });
      }

      // 2) Atajo gratis: mensaje CORTO solo-precio → completa el último evento sin precio.
      const shortMsg = text.split(/\s+/).length <= 4;
      const pp = shortMsg ? parsePriceText(text) : null;
      if (pp) {
        const title = await fillLatestMissingPrice(String(chatId), pp.price, pp.info);
        if (title) {
          const shown = pp.info ?? (pp.price === 0 ? "Entrada libre" : `${pp.price} €`);
          await tgSend(chatId, `💶 ¡Listo! Añadí el precio a «${title}»: <b>${shown}</b>.`);
          return NextResponse.json({ ok: true });
        }
      }

      // 3) Cerebro conversacional (Claude): entiende y ejecuta acciones.
      // Nunca se queda mudo: si algo falla, responde igualmente.
      try {
        const today = new Date().toISOString().slice(0, 10);
        const reply = await converse({
          events: await loadBrainEvents(String(chatId)),
          userName: fromName,
          text: brainText,
          today,
          runTool: makeRunTool(String(chatId)),
        });
        await tgSend(chatId, reply || "Cuéntame, ¿qué necesitas? Puedo subir tu evento (mándame el flyer), buscar planes o cambiar algo.");
      } catch (e) {
        console.error("[bot/telegram] brain", e);
        await tgSend(chatId, "Uy, algo se me cruzó 😅. Reinténtalo en un momento, o mándame el flyer y te lo subo.");
      }
      return NextResponse.json({ ok: true });
    }

    // Foto de mayor resolución (último elemento del array).
    const photo = msg.photo[msg.photo.length - 1];
    const dl = await tgDownloadPhoto(photo.file_id);
    if (!dl) {
      await tgSend(chatId, "No pude descargar la imagen 😕. Inténtalo de nuevo.");
      return NextResponse.json({ ok: true });
    }

    await tgSend(chatId, `📸 ¡Gracias${fromName ? " " + fromName : ""}! Recibido. Leyendo el flyer…`);

    // Subir a R2 + extraer datos en paralelo.
    const ext = dl.mediaType === "image/png" ? "png" : dl.mediaType === "image/webp" ? "webp" : "jpg";
    const [{ url: imageUrl, key: imageKey }, extracted] = await Promise.all([
      uploadToR2(dl.buffer, makeKey("eventos", ext), dl.mediaType),
      extractEventFromImage(dl.buffer.toString("base64"), dl.mediaType),
    ]);

    if (!extracted) {
      await tgSend(chatId, "Subí tu flyer pero no pude leer los datos 🤔. Abre tu cuenta y complétalos en el panel.");
      return NextResponse.json({ ok: true });
    }
    if (!extracted.event_date) {
      await tgSend(chatId, "Leí el flyer pero no encuentro la <b>fecha</b> 📅. Asegúrate de que aparezca y reenvíalo.");
      return NextResponse.json({ ok: true });
    }

    const ref = String(chatId);
    const claimToken = await claimTokenFor(ref);
    const knownEmail = await emailFor(ref);
    const seriesKey = seriesKeyFromTitle(extracted.title);
    const newStatus = extracted.is_cancelled ? "cancelled" : "published";

    // ¿Ya existe esta ocurrencia? (misma serie, misma fecha, mismo remitente)
    // → es un cambio/cancelación: ACTUALIZAMOS en vez de duplicar.
    const { data: existing } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("submitter_channel", "telegram")
      .eq("submitter_ref", ref)
      .eq("event_date", extracted.event_date)
      .eq("series_key", seriesKey)
      .limit(1)
      .maybeSingle();

    const payload = {
      submitter_name: fromName || null,
      submitter_email: knownEmail,
      series_key: seriesKey,
      source: "telegram",
      status: newStatus,
      title: extracted.title,
      description: extracted.description,
      event_date: extracted.event_date,
      event_time: extracted.event_time,
      country: "es",
      city: extracted.city || "madrid",
      venue: extracted.venue || "Por confirmar",
      neighborhood: extracted.neighborhood,
      category: extracted.category,
      price: extracted.price,
      price_info: extracted.price_info,
      has_online_sale: extracted.has_online_sale,
      ticket_url: extracted.ticket_url,
      image_url: imageUrl,
      image_key: imageKey,
    };

    let error;
    if (existing) {
      // Actualiza la ocurrencia existente (no toca organizer_id ni claim_token).
      ({ error } = await supabaseAdmin.from("events").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabaseAdmin.from("events").insert({
        ...payload,
        organizer_id: null,
        submitter_channel: "telegram",
        submitter_ref: ref,
        claim_token: claimToken,
      }));
    }

    if (error) {
      console.error("[bot/telegram] upsert", error.message);
      await tgSend(chatId, "Ups, no pude publicar el evento. Inténtalo más tarde 🙏");
      return NextResponse.json({ ok: true });
    }

    const claimUrl = `${APP_URL}/organizador?claim=${claimToken}`;
    // Encabezado según el caso: cancelado / actualizado / nuevo.
    const head = extracted.is_cancelled
      ? `🚫 ${hi}marqué como <b>CANCELADO</b> «${extracted.title}»`
      : existing
      ? `🔄 ${hi}actualicé «${extracted.title}»`
      : `✅ ${hi}publiqué <b>${extracted.title}</b> en la agenda`;
    const priceLine = extracted.price_info
      ? `💶 ${extracted.price_info}\n`
      : extracted.price == null
      ? "💶 Precio: no lo vi en el flyer → sale como “Consultar”.\n"
      : extracted.price === 0
      ? "💶 Entrada libre\n"
      : `💶 ${extracted.price} €\n`;

    // Otros datos que falten (el precio se trata aparte, abajo).
    const missing: string[] = [];
    if (!extracted.venue) missing.push("lugar");

    // Si falta el precio, invitamos a completarlo AQUÍ MISMO en el chat.
    const priceMissing = extracted.price == null && !extracted.price_info;
    const completeLine = priceMissing
      ? `\n⚠️ Faltó el <b>precio</b>. Respóndeme aquí mismo (ej. «12€», «anticipada 12 taquilla 15» o «gratis») y lo añado.`
      : missing.length
      ? `\n⚠️ Faltó: <b>${missing.join(", ")}</b>. Respóndeme aquí o edítalo en tu panel.`
      : "";

    // Email opcional (solo si aún no lo tenemos).
    const askEmail = !knownEmail
      ? "\n📧 Si me dejas tu email, te aviso cuando a un evento le falte algún dato."
      : "";

    await tgSend(
      chatId,
      `${head}\n` +
        `📅 ${extracted.event_date} · ${extracted.event_time}\n` +
        `📍 ${extracted.venue || "—"}\n` +
        priceLine +
        completeLine +
        askEmail +
        `\n\n✨ <b>Gratis</b>: cambia lo que quieras del flyer, configura varios eventos, planifica todo el año y mira lo que publican otros organizadores 👉\n${claimUrl}`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bot/telegram]", err);
    return NextResponse.json({ ok: true }); // siempre 200 a Telegram
  }
}
