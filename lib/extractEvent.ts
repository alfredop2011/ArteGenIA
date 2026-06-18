/**
 * Extrae los datos de un evento a partir de la imagen de un flyer usando
 * Claude (visión). Lo usan el bot de Telegram/WhatsApp y, en el futuro, el
 * autofill del panel web ("sube el flyer y rellena solo").
 *
 * Devuelve los campos ya mapeados a la taxonomía de la tabla `events`, o null
 * si no hay API key o la respuesta no es parseable (el caller decide el
 * fallback: pedir los datos a mano).
 */

import type { EventCategory } from "@/lib/supabase";

export type ExtractedEvent = {
  title: string;
  event_date: string | null; // yyyy-mm-dd
  event_time: string; // HH:mm
  city: string;
  venue: string;
  neighborhood: string | null;
  category: EventCategory;
  price: number | null; // null = el flyer no indica precio. Si hay tarifas = "desde" (mínimo)
  price_info: string | null; // detalle si hay varias tarifas
  has_online_sale: boolean;
  ticket_url: string | null;
  description: string | null;
  confidence: "alta" | "media" | "baja";
};

const VALID_CATS: EventCategory[] = ["fiesta", "conciertos", "festival", "clases", "club", "corporativo"];

const SYSTEM = `Eres un extractor de datos de flyers de eventos. Recibes la imagen de un flyer y devuelves SOLO un objeto JSON (sin texto extra, sin markdown) con esta forma exacta:
{
  "title": string,                 // nombre del evento, conciso
  "event_date": string|null,       // "YYYY-MM-DD". REGLA DE AÑO abajo. null si no hay fecha clara
  "event_time": string,            // "HH:mm" 24h. "20:00" si no aparece
  "city": string,                  // ciudad en minúsculas sin tildes: "madrid","barcelona","valencia","sevilla". "madrid" si no aparece
  "venue": string,                 // sala/lugar. "" si no aparece
  "neighborhood": string|null,     // barrio/zona o null
  "category": string,              // UNA de: "fiesta","conciertos","festival","clases","club","corporativo"
  "price": number|null,            // euros. Si hay VARIAS tarifas, pon la MÁS BARATA aquí. 0 SOLO si dice "gratis/free/entrada libre". null si el flyer NO muestra precio. Nunca inventes
  "price_info": string|null,       // si hay varias tarifas, el detalle tal cual: "Anticipada 12€ · Taquilla 15€". null si solo hay un precio o ninguno
  "has_online_sale": boolean,      // true si el flyer indica venta/reserva online o muestra un enlace de entradas
  "ticket_url": string|null,       // URL de compra/reserva si aparece, si no null
  "description": string|null,      // 1 frase con lo relevante (artistas, line-up) o null
  "confidence": "alta"|"media"|"baja"  // qué tan seguro estás de los datos
}
Mapea la categoría: clases/talleres/masterclass de baile -> "clases"; fiesta/social -> "fiesta"; discoteca/club night -> "club"; festival -> "festival"; concierto/directo/música en vivo -> "conciertos"; evento de empresa/networking -> "corporativo".`;

// Regla de año: el modelo no sabe en qué año estamos, así que se la inyectamos.
function dateRule(today: string): string {
  return `Hoy es ${today}. Si el flyer NO indica el año, elige el año que haga que la fecha sea HOY o futura (nunca una fecha pasada). Solo devuelve una fecha pasada si el flyer la escribe explícitamente con ese año.`;
}

export async function extractEventFromImage(
  base64: string,
  mediaType: string
): Promise<ExtractedEvent | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[extractEvent] Falta ANTHROPIC_API_KEY — no se puede leer el flyer");
    return null;
  }
  const today = new Date().toISOString().slice(0, 10);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
              { type: "text", text: `${dateRule(today)}\nExtrae los datos de este flyer en el JSON indicado.` },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      console.warn("[extractEvent] Anthropic API error", res.status);
      return null;
    }
    const data = await res.json();
    const text: string = data.content?.[0]?.text?.trim() ?? "";
    // El modelo puede envolver el JSON en ```json … ``` — lo limpiamos.
    const jsonStr = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const raw = JSON.parse(jsonStr);

    const category: EventCategory = VALID_CATS.includes(raw.category) ? raw.category : "fiesta";
    // Red de seguridad: si la fecha quedó en el pasado (típico: el flyer no
    // ponía año y el modelo adivinó mal), adelanta el año hasta que sea futura.
    let eventDate = typeof raw.event_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.event_date) ? raw.event_date : null;
    if (eventDate && eventDate < today) {
      const [y0, m, d] = eventDate.split("-").map(Number);
      let y = y0;
      const md = `-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      while (`${y}${md}` < today) y += 1;
      eventDate = `${y}${md}`;
    }
    return {
      title: String(raw.title || "Evento").slice(0, 120),
      event_date: eventDate,
      event_time: typeof raw.event_time === "string" && /^\d{1,2}:\d{2}$/.test(raw.event_time) ? raw.event_time : "20:00",
      city: String(raw.city || "madrid").toLowerCase().trim(),
      venue: String(raw.venue || "").slice(0, 120),
      neighborhood: raw.neighborhood ? String(raw.neighborhood).slice(0, 80) : null,
      category,
      price: raw.price == null ? null : Number.isFinite(Number(raw.price)) ? Math.max(0, Number(raw.price)) : null,
      price_info: raw.price_info ? String(raw.price_info).slice(0, 120) : null,
      has_online_sale: Boolean(raw.has_online_sale),
      ticket_url: typeof raw.ticket_url === "string" && raw.ticket_url.startsWith("http") ? raw.ticket_url : null,
      description: raw.description ? String(raw.description).slice(0, 300) : null,
      confidence: ["alta", "media", "baja"].includes(raw.confidence) ? raw.confidence : "media",
    };
  } catch (err) {
    console.warn("[extractEvent] fallo parseando respuesta:", err instanceof Error ? err.message : err);
    return null;
  }
}
