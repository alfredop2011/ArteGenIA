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
  artistCount: number;
  flyerType: "with_photo" | "no_photo" | "logos_only" | null;
  visualStyle: string | null;
  mood: string | null;
  extraNotes: string | null;
  readyToGenerate: boolean;
  needsPhotoUpload: boolean;
  missingFields: string[];
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type WizardResponse = {
  message: string;
  eventData: EventData;
  ctaLabel: "continue" | "confirm" | "generate";
  showPhotoUpload: boolean;
};

type AnthropicContent = { type: string; text: string };
type AnthropicResponse = { content: AnthropicContent[] };

export const EMPTY_EVENT: EventData = {
  eventName: null, eventType: null, date: null, time: null,
  venue: null, city: null, isFree: null, price: null,
  mainArtist: null, additionalArtists: [], artistCount: 1,
  flyerType: null, visualStyle: null, mood: null, extraNotes: null,
  readyToGenerate: false, needsPhotoUpload: false, missingFields: [],
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
  return m;
}

function isReadyToGenerate(d: EventData): boolean {
  const blocking = computeMissingFields(d).filter(
    f => ["eventName", "date", "venue", "flyerType"].includes(f)
  );
  return blocking.length === 0;
}

function getSystemPrompt(today: string): string {
  return `You are ArteGenIA, a friendly assistant that creates professional event flyers through conversation.

TODAY: ${today}

OUTPUT RULE: Respond ONLY with a raw JSON object. No markdown, no backticks, no text before or after the JSON.

GOAL: Collect all event information naturally. Ask 1-2 questions per message. Never feel like a form. Respond in the user's language (Spanish or English).

FIELDS TO COLLECT (in priority order):
1. eventName — name of the event
2. eventType — concert, festival, party, brunch, conference, etc.
3. date — resolve relative dates ("este viernes", "tomorrow", "next Saturday") using TODAY
4. time — start time
5. venue — specific venue name
6. city — city
7. isFree — is it free or paid? ALWAYS ASK THIS.
8. price — only if isFree is false
9. mainArtist — headliner / main artist name
10. additionalArtists — other artists on the lineup
11. flyerType — "with_photo" | "no_photo" | "logos_only"
12. visualStyle — urban, elegant, neon, festival, minimal, retro, tropical, etc.
13. mood — energetic, chill, luxurious, underground, romantic, etc.

PRICE RULE — always ask explicitly:
"¿El evento es gratuito o tiene precio de entrada?" / "Is this event free or is there a ticket price?"
- "free" / "gratis" / "entrada libre" → isFree: true, price: "Entrada libre"
- any price amount → isFree: false, price: that value

ARTIST RULE:
- Ask for the main/headliner artist early
- Ask "¿Hay más artistas en el cartel?" / "Are there any other artists?"
- Collect additional names in additionalArtists[]
- artistCount = 1 + additionalArtists.length
- If flyerType is "with_photo" → needsPhotoUpload: true

PHOTO TRIGGER:
- Set showPhotoUpload: true the FIRST time flyerType becomes "with_photo"

CORRECTIONS: Handle naturally. "Actually make it Saturday" → update silently, confirm in reply.

READY TO GENERATE: Set readyToGenerate: true when all of these are filled:
eventName + (date or time) + (venue or city) + isFree (not null) + mainArtist + flyerType

WHEN READY: Show bullet summary and ask to confirm:
"¿Todo correcto? ¿Generamos el flyer?" → ctaLabel: "confirm"
After user confirms → ctaLabel: "generate"

FIELD DETECTION from user text:
- "gratis" / "gratuito" / "free" / "entrada libre" → isFree: true
- "5€" / "10 euros" / "$20" → isFree: false, price: that string
- "con foto" / "with photo" / "foto del artista" → flyerType: "with_photo"
- "sin foto" / "no photo" / "sin artista" → flyerType: "no_photo"
- "solo logos" / "logos only" → flyerType: "logos_only"
- "también actúa" / "también está" / "y también" / "and also" → add to additionalArtists

RESPOND WITH EXACTLY THIS JSON SHAPE:
{
  "message": "string",
  "eventData": {
    "eventName": null,
    "eventType": null,
    "date": null,
    "time": null,
    "venue": null,
    "city": null,
    "isFree": null,
    "price": null,
    "mainArtist": null,
    "additionalArtists": [],
    "artistCount": 1,
    "flyerType": null,
    "visualStyle": null,
    "mood": null,
    "extraNotes": null,
    "readyToGenerate": false,
    "needsPhotoUpload": false,
    "missingFields": []
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

    if (!response.ok) {
      console.error("[chat-wizard] Anthropic error:", await response.text());
      throw new Error(`Anthropic ${response.status}`);
    }

    const data = await response.json() as AnthropicResponse;
    const raw = data.content?.[0]?.text?.trim() ?? "";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

    let parsed: WizardResponse;
    try {
      parsed = JSON.parse(clean);
      // Recompute server-side for consistency
      parsed.eventData.missingFields = computeMissingFields(parsed.eventData);
      parsed.eventData.readyToGenerate = isReadyToGenerate(parsed.eventData);
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
