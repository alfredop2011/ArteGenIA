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
  price: string | null;
  artists: string[];
  flyerType: "with_photo" | "no_photo" | "logos_only" | null;
  visualStyle: string | null;
  extraNotes: string | null;
  readyToGenerate: boolean;
  artistCount: number;
  needsPhotoUpload: boolean;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type WizardResponse = {
  message: string;
  eventData: EventData;
  ctaLabel: "continue" | "generate" | "confirm";
  showPhotoUpload: boolean;
};

type AnthropicContent = { type: string; text: string };
type AnthropicResponse = { content: AnthropicContent[] };

function isReadyToGenerate(data: EventData): boolean {
  return !!(
    data.eventName &&
    (data.date || data.time) &&
    (data.venue || data.city) &&
    data.flyerType !== null
  );
}

function getMissingFields(data: EventData): string[] {
  const missing: string[] = [];
  if (!data.eventName) missing.push("eventName");
  if (!data.date && !data.time) missing.push("date");
  if (!data.venue && !data.city) missing.push("venue");
  if (!data.flyerType) missing.push("flyerType");
  return missing;
}

function getSystemPrompt(today: string): string {
  return `You are ArteGenIA, a concise assistant that helps users create event flyers.

TODAY: ${today}

INPUT: You receive the user's latest message plus the current structured event data object.
OUTPUT: You must return ONLY a raw JSON object — no markdown, no backticks, no explanation.

YOUR TASKS:
1. Extract any new event info from the user's message
2. Merge it into the existing eventData (never lose old data)
3. Identify the single most important missing field
4. Ask ONE short natural follow-up question, or show summary if ready

FIELD EXTRACTION RULES:
- eventName: name of the event or artist
- eventType: concert, festival, party, conference, etc.
- date: resolve relative dates using TODAY
- time: start time
- venue: specific venue/room name
- city: city
- price: ticket price or "entrada libre"
- artists: list of performer names
- flyerType: "with_photo" | "no_photo" | "logos_only"
- visualStyle: modern, elegant, neon, festival, minimal, retro
- artistCount: number of artists (default 1)
- needsPhotoUpload: true when flyerType is "with_photo"

CONVERSATION RULES:
- Ask max 1 question per reply. Be brief (1-2 sentences max).
- Never re-ask info already provided.
- If user says "skip", "tu decides", "no se" -> pick a reasonable default.
- When flyerType becomes "with_photo", set needsPhotoUpload: true.
- Set readyToGenerate: true when eventName + (date or time) + (venue or city) + flyerType are filled.
- When readyToGenerate becomes true: show a bullet-point summary then ask confirmation.
- ctaLabel: "confirm" when showing summary, "generate" after user confirms, "continue" otherwise.
- Set showPhotoUpload: true when flyerType becomes "with_photo" for the first time.
- Respond in the SAME LANGUAGE as the user.

RESPOND WITH THIS EXACT JSON (no extra text before or after):
{
  "message": "string",
  "eventData": {
    "eventName": null,
    "eventType": null,
    "date": null,
    "time": null,
    "venue": null,
    "city": null,
    "price": null,
    "artists": [],
    "flyerType": null,
    "visualStyle": null,
    "extraNotes": null,
    "readyToGenerate": false,
    "artistCount": 1,
    "needsPhotoUpload": false
  },
  "ctaLabel": "continue",
  "showPhotoUpload": false
}`;
}

export const EMPTY_EVENT: EventData = {
  eventName: null, eventType: null, date: null, time: null,
  venue: null, city: null, price: null, artists: [],
  flyerType: null, visualStyle: null, extraNotes: null,
  readyToGenerate: false, artistCount: 1, needsPhotoUpload: false,
};

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
        message: "Cuéntame sobre tu evento — nombre, fecha y lugar son lo más importante.",
        eventData: currentEventData ?? EMPTY_EVENT,
        ctaLabel: "continue",
        showPhotoUpload: false,
      } as WizardResponse);
    }

    const stateContext = `CURRENT EVENT DATA: ${JSON.stringify(currentEventData ?? EMPTY_EVENT)}
MISSING FIELDS: ${getMissingFields(currentEventData ?? EMPTY_EVENT).join(", ") || "none"}`;

    // Cost optimization: only last 4 messages for context
    const trimmedContext = recentContext.slice(-4);

    const messagesForAPI: ChatMessage[] = [
      ...trimmedContext,
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
        max_tokens: 600,
        system: getSystemPrompt(today),
        messages: messagesForAPI,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[chat-wizard] Anthropic error:", errText);
      throw new Error(`Anthropic ${response.status}`);
    }

    const data = await response.json() as AnthropicResponse;
    const raw = data.content?.[0]?.text?.trim() ?? "";

    const clean = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed: WizardResponse;
    try {
      parsed = JSON.parse(clean);
      parsed.eventData.readyToGenerate = isReadyToGenerate(parsed.eventData);
    } catch (parseErr) {
      console.error("[chat-wizard] JSON parse failed:", parseErr, "\nRaw:", raw);
      parsed = {
        message: "Cuéntame más sobre tu evento.",
        eventData: currentEventData ?? EMPTY_EVENT,
        ctaLabel: "continue",
        showPhotoUpload: false,
      };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[chat-wizard] fatal error:", err);
    return NextResponse.json({
      message: "Algo salió mal. ¿Puedes intentarlo de nuevo?",
      eventData: EMPTY_EVENT,
      ctaLabel: "continue",
      showPhotoUpload: false,
    } as WizardResponse);
  }
}
