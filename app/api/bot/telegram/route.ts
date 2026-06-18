import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { uploadToR2, makeKey } from "@/lib/r2";
import { extractEventFromImage } from "@/lib/extractEvent";

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

    // /start o texto sin foto → instrucciones (saludo personalizado).
    if (!msg.photo) {
      await tgSend(
        chatId,
        `👋 ¡Hola${fromName ? " " + fromName : ""}! Envíame el <b>flyer</b> de tu evento (como foto) y lo publico solo en la agenda. Leo la fecha, el lugar y el precio automáticamente.`
      );
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
    const { error } = await supabaseAdmin.from("events").insert({
      organizer_id: null,
      submitter_channel: "telegram",
      submitter_ref: ref,
      submitter_name: fromName || null,
      claim_token: claimToken,
      source: "telegram",
      status: "published",
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
      has_online_sale: extracted.has_online_sale,
      ticket_url: extracted.ticket_url,
      image_url: imageUrl,
      image_key: imageKey,
    });

    if (error) {
      console.error("[bot/telegram] insert", error.message);
      await tgSend(chatId, "Ups, no pude publicar el evento. Inténtalo más tarde 🙏");
      return NextResponse.json({ ok: true });
    }

    const claimUrl = `${APP_URL}/organizador?claim=${claimToken}`;
    const priceLine =
      extracted.price == null
        ? "💶 Precio: no lo vi en el flyer → sale como “Consultar”. Edítalo al reclamar.\n"
        : extracted.price === 0
        ? "💶 Entrada libre\n"
        : `💶 ${extracted.price} €\n`;
    await tgSend(
      chatId,
      `✅ ${hi}publiqué <b>${extracted.title}</b> en la agenda\n` +
        `📅 ${extracted.event_date} · ${extracted.event_time}\n` +
        `📍 ${extracted.venue || "—"}\n` +
        priceLine +
        `\nCuando quieras gestionarlo, abre tu cuenta y reclama tus eventos aquí:\n${claimUrl}`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[bot/telegram]", err);
    return NextResponse.json({ ok: true }); // siempre 200 a Telegram
  }
}
