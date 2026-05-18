import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export type EventData = {
  eventName: string | null;
  eventType: string | null;
  date: string | null;
  time: string | null;
  venue: string | null;
  city: string | null;
  isFree: boolean | null;
  price: string | null;
  mainArtist: string | null;
  additionalArtists: string[];
  artists: string[];
  artistCount: number;
  flyerType: "with_photo" | "no_photo" | "logos_only" | null;
  backgroundDescription: string | null;
  format: string | null;
  extraNotes: string | null;
  readyToGenerate: boolean;
  needsPhotoUpload: boolean;
  missingFields: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type QuickReply = {
  label: string;
  value: string;
  emoji?: string;
};

export type InlineCard =
  | { type: "format_selector" }
  | { type: "flyer_type_selector" }
  | { type: "price_selector" }
  | { type: "photo_action" };

export type WizardResponse = {
  message: string;
  eventData: EventData;
  ctaLabel: "continue" | "confirm" | "generate";
  showPhotoUpload: boolean;
  quickReplies?: QuickReply[];
  inlineCard?: InlineCard;
};

type AnthropicContent = { type: string; text: string };
type AnthropicResponse = { content: AnthropicContent[] };

export const EMPTY_EVENT: EventData = {
  eventName: null, eventType: null, date: null, time: null,
  venue: null, city: null, isFree: null, price: null,
  mainArtist: null, additionalArtists: [], artists: [], artistCount: 1,
  flyerType: null, backgroundDescription: null, format: null,
  extraNotes: null, readyToGenerate: false, needsPhotoUpload: false, missingFields: [],
};

function computeMissingFields(d: EventData): string[] {
  const m: string[] = [];
  if (!d.eventName) m.push("eventName");
  if (!d.date && !d.time) m.push("date");
  if (!d.venue && !d.city) m.push("venue");
  if (d.isFree === null) m.push("isFree");
  if (d.isFree === false && !d.price) m.push("price");
  if (!d.mainArtist) m.push("mainArtist");
  if (!d.flyerType) m.push("flyerType");
  if (!d.backgroundDescription) m.push("backgroundDescription");
  return m;
}

function isReadyToGenerate(d: EventData): boolean {
  const blocking = computeMissingFields(d).filter(f =>
    ["eventName", "date", "venue", "flyerType", "backgroundDescription"].includes(f)
  );
  return blocking.length === 0;
}

// Detect which inline card to show based on AI message content
function detectInlineCard(d: EventData, message: string): InlineCard | undefined {
  const msg = message.toLowerCase();

  if (!d.flyerType && (msg.includes("foto") || msg.includes("flyer") || msg.includes("photo") || msg.includes("logo") || msg.includes("tipo de"))) {
    return { type: "flyer_type_selector" };
  }
  if (!d.format && (msg.includes("formato") || msg.includes("format") || msg.includes("instagram") || msg.includes("historia") || msg.includes("tamaño"))) {
    return { type: "format_selector" };
  }
  if (d.isFree === null && (msg.includes("gratuito") || msg.includes("precio") || msg.includes("free") || msg.includes("ticket") || msg.includes("entrada"))) {
    return { type: "price_selector" };
  }
  return undefined;
}

// Detect quick replies
function detectQuickReplies(d: EventData, message: string): QuickReply[] | undefined {
  const msg = message.toLowerCase();

  if (d.mainArtist && !d.additionalArtists.length && (msg.includes("más artistas") || msg.includes("more artist") || msg.includes("cartel") || msg.includes("adicional"))) {
    return [
      { label: "Solo ese artista", value: "Solo ese artista", emoji: "👤" },
      { label: "Hay más artistas", value: "Sí, hay más artistas en el cartel", emoji: "👥" },
    ];
  }
  return undefined;
}

function getSystemPrompt(today: string): string {
  return `You are ArteGenIA, a fast concise flyer assistant.

TODAY: ${today}

OUTPUT: Raw JSON only. No markdown, no backticks.

CRITICAL RULES:
1. Check CURRENT EVENT STATE before every reply — NEVER ask for fields already filled.
2. Replies MAX 1-2 short sentences. No long explanations.
3. Ask ONLY the single most important missing field.
4. If all required fields are complete → say exactly: "Ready ✅ Generate your flyer." and set readyToGenerate: true, ctaLabel: "generate".
5. If user gives info you already have → acknowledge briefly and ask next missing field only.
6. Respond in the user's language (Spanish or English).

REQUIRED FIELDS (in priority order):
1. eventName
2. eventType
3. date
4. time (optional but ask once)
5. venue + city
6. isFree → price if paid
7. mainArtist
8. flyerType (with_photo / no_photo / logos_only)
9. backgroundDescription — ask: "Describe el fondo: ambiente, colores, escena."

WHEN COMPLETE: Set readyToGenerate: true, ctaLabel: "generate", message: "Ready ✅ Generate your flyer."

SHORT REPLY EXAMPLES:
- Missing price: "¿Entrada libre o tiene precio?"
- Missing photo: "¿Con foto de artista, sin foto o solo logos?"
- Missing background: "Describe el fondo que quieres."
- Everything done: "Ready ✅ Generate your flyer."
- User repeats info: "Ya lo tengo. ¿[next missing field]?"

FIELD DETECTION:
- "gratis" / "free" / "entrada libre" → isFree: true, price: "Entrada libre"
- amount → isFree: false, price: that value
- "con foto" / "with photo" → flyerType: "with_photo", needsPhotoUpload: true
- "sin foto" / "no photo" → flyerType: "no_photo"
- "solo logos" → flyerType: "logos_only"
- relative dates → resolve using TODAY

RESPOND WITH THIS JSON:
{
  "message": "string",
  "eventData": {
    "eventName": null, "eventType": null, "date": null, "time": null,
    "venue": null, "city": null, "isFree": null, "price": null,
    "mainArtist": null, "additionalArtists": [], "artists": [], "artistCount": 1,
    "flyerType": null, "backgroundDescription": null, "format": null,
    "extraNotes": null, "readyToGenerate": false, "needsPhotoUpload": false, "missingFields": []
  },
  "ctaLabel": "continue",
  "showPhotoUpload": false
}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      latestUserMessage: string;
      currentEventData: EventData;
      recentContext?: ChatMessage[];
    };

    const { latestUserMessage, currentEventData, recentContext = [] } = body;

    const today = new Date().toLocaleDateString("es-ES", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        message: "Cuéntame sobre tu evento — nombre, fecha y lugar para empezar.",
        eventData: currentEventData ?? EMPTY_EVENT,
        ctaLabel: "continue",
        showPhotoUpload: false,
      } as WizardResponse);
    }

    const missing = computeMissingFields(currentEventData ?? EMPTY_EVENT);
    const stateContext = `CURRENT EVENT STATE: ${JSON.stringify(currentEventData ?? EMPTY_EVENT)}
STILL MISSING: ${missing.length ? missing.join(", ") : "nothing — ready"}`;

    const messagesForAPI: ChatMessage[] = [
      ...recentContext.slice(-4),
      { role: "user", content: `${stateContext}\n\nUSER MESSAGE: ${latestUserMessage}` },
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        system: getSystemPrompt(today),
        messages: messagesForAPI,
      }),
    });

    if (!response.ok) throw new Error(`Anthropic ${response.status}`);

    const data = await response.json() as AnthropicResponse;
    const raw = data.content?.[0]?.text?.trim() ?? "";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed: WizardResponse;
    try {
      parsed = JSON.parse(clean);
      parsed.eventData.missingFields = computeMissingFields(parsed.eventData);
      parsed.eventData.readyToGenerate = isReadyToGenerate(parsed.eventData);
      parsed.inlineCard = detectInlineCard(parsed.eventData, parsed.message);
      parsed.quickReplies = detectQuickReplies(parsed.eventData, parsed.message);
    } catch (e) {
      console.error("[chat-wizard] parse error:", e, "\nRaw:", raw);
      parsed = {
        message: "Cuéntame más sobre tu evento.",
        eventData: currentEventData ?? EMPTY_EVENT,
        ctaLabel: "continue",
        showPhotoUpload: false,
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[chat-wizard] fatal:", err);
    return NextResponse.json({
      message: "Algo salió mal. ¿Puedes intentarlo de nuevo?",
      eventData: EMPTY_EVENT,
      ctaLabel: "continue",
      showPhotoUpload: false,
    } as WizardResponse);
  }
}
