/**
 * "Cerebro" conversacional del bot (Telegram/WhatsApp): Claude entiende
 * lenguaje natural y, si hace falta, ejecuta acciones sobre los eventos del
 * organizador vía tool-use (editar, cancelar, reactivar). La ejecución real
 * la hace el caller (runTool), que limita los cambios a los eventos de ese
 * remitente — el cerebro nunca toca eventos ajenos.
 */

const MODEL = "claude-haiku-4-5-20251001";

export type BrainEvent = {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  venue: string;
  price: number | null;
  status: string;
  viewCount: number;
  clickCount: number;
  hasLink: boolean;
};

type ToolInput = Record<string, unknown>;
export type ToolRunner = (name: string, input: ToolInput) => Promise<string>;

type Block = { type: string; text?: string; id?: string; name?: string; input?: ToolInput };
type Msg = { role: "user" | "assistant"; content: string | unknown[] };

const TOOLS = [
  {
    name: "actualizar_evento",
    description: "Actualiza uno o varios campos de un evento del organizador. Incluye solo los campos a cambiar.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "id del evento (de la lista dada)" },
        event_time: { type: "string", description: "hora en formato HH:mm" },
        event_date: { type: "string", description: "fecha YYYY-MM-DD" },
        venue: { type: "string", description: "lugar / sala" },
        title: { type: "string", description: "título del evento" },
        price: { type: "number", description: "precio en euros; 0 = gratis" },
        price_info: { type: "string", description: "detalle de tarifas, ej. 'Anticipada 12€ · Taquilla 15€'" },
      },
      required: ["id"],
    },
  },
  {
    name: "cancelar_evento",
    description: "Marca un evento como cancelado (aparece con sello CANCELADO en la agenda).",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "reactivar_evento",
    description: "Reactiva (vuelve a publicar) un evento cancelado.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "borrar_evento",
    description: "Borra un evento DEFINITIVAMENTE (úsalo para quitar duplicados). Confirma con la persona ANTES de borrar.",
    input_schema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "buscar_eventos",
    description: "Busca eventos PÚBLICOS de la agenda (de cualquier organizador) para responder a quien pregunta '¿qué hay en Madrid hoy/esta semana?'. Filtra por ciudad y rango de fechas.",
    input_schema: {
      type: "object",
      properties: {
        ciudad: { type: "string", description: "ciudad en minúsculas sin tildes: madrid, barcelona… (vacío = todas)" },
        desde: { type: "string", description: "fecha inicio YYYY-MM-DD (incluida)" },
        hasta: { type: "string", description: "fecha fin YYYY-MM-DD (incluida)" },
      },
    },
  },
  {
    name: "silenciar_avisos",
    description: "El organizador pide no recibir avisos/notificaciones del bot.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "activar_avisos",
    description: "El organizador quiere volver a recibir avisos del bot.",
    input_schema: { type: "object", properties: {} },
  },
];

export async function converse(opts: {
  events: BrainEvent[];
  userName: string;
  text: string;
  today: string;
  runTool: ToolRunner;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "Ahora no puedo conversar 🤖. Envíame el flyer de tu evento (foto) y lo publico.";

  const list = opts.events.length
    ? opts.events
        .map(
          (e) =>
            `- id:${e.id} | "${e.title}" | ${e.event_date} ${e.event_time} | ${e.venue} | ${
              e.price == null ? "consultar" : e.price === 0 ? "gratis" : e.price + "€"
            } | ${e.status} | 👁 ${e.viewCount} vistas · 🛒 ${e.clickCount} clics | ${e.hasLink ? "con link de compra" : "SIN link de compra"}`
        )
        .join("\n")
    : "(todavía no tiene eventos)";

  const system = `Hoy es ${opts.today}. Eres alguien del mundillo de los eventos que echa una mano por chat — cálido, cercano y en PRIMERA PERSONA. Tuteas. NUNCA digas "soy el asistente de ArteGenIA" ni hables como bot corporativo: habla como persona ("te subo el evento", "mira lo que veo", "¿te lo cambio?"). Español natural, frases cortas, algún emoji con mesura.

Sabes hacer dos cosas:
1) Decirle a cualquiera qué eventos hay → SIEMPRE usa "buscar_eventos" con ciudad y fechas (calcula las fechas ISO desde hoy: "hoy"=hoy, "esta semana"=hoy..+7, "mañana"=+1). Nunca digas que no puedes buscar.
2) Gestionar los eventos de quien escribe (los de abajo): editar fecha/hora/precio/lugar/título ("actualizar_evento"), cancelar ("cancelar_evento"), reactivar ("reactivar_evento"), borrar ("borrar_evento").

Eventos de ${opts.userName || "esta persona"} (SOLO estos puedes tocar):
${list}

Sé PROACTIVO, no esperes a que te lo pidan todo:
- Cuéntale con naturalidad qué eventos suyos tienes subidos y cómo van (👁 vistas / 🛒 clics) con una idea para mejorar.
- Si le falta info (precio "consultar", lugar por confirmar), pídesela.
- Si ves DUPLICADOS (mismo título y misma fecha), avísale tú: "oye, tienes 'X' repetido el día Y, ¿te borro uno?" y, si dice que sí, usa "borrar_evento". CONFIRMA siempre antes de borrar.
- Si no tiene link de compra, sugiérele añadirlo o cómo asistir.
- Invita a registrarse MUY sutil, sin insistir.
- "silenciar"/"activar" → silenciar_avisos / activar_avisos.
- Para crear un evento nuevo, pídele el flyer (foto). No inventes datos. Si dudas a qué evento se refiere, pregunta antes de actuar.`;

  const messages: Msg[] = [{ role: "user", content: opts.text }];

  for (let round = 0; round < 3; round++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 500, system, tools: TOOLS, messages }),
    });
    if (!res.ok) return "Uy, no pude procesar eso ahora 🤔. Inténtalo otra vez o envíame el flyer.";
    const data = await res.json();
    const content: Block[] = data.content ?? [];
    const toolUses = content.filter((c) => c.type === "tool_use");

    if (toolUses.length === 0) {
      const txt = content
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("\n")
        .trim();
      return txt || "Hecho ✅";
    }

    // Ejecuta cada herramienta y devuelve el resultado a Claude.
    messages.push({ role: "assistant", content });
    const results = [];
    for (const tu of toolUses) {
      const out = await opts.runTool(tu.name ?? "", tu.input ?? {});
      results.push({ type: "tool_result", tool_use_id: tu.id, content: out });
    }
    messages.push({ role: "user", content: results });
  }
  return "Listo ✅";
}
