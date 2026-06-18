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
            } | ${e.status}`
        )
        .join("\n")
    : "(todavía no tiene eventos)";

  const system = `Eres el asistente de ArteGenIA para organizadores de eventos, por chat. Hoy es ${opts.today}.
El organizador ${opts.userName || ""} tiene estos eventos (SOLO puedes tocar estos):
${list}

Responde en español, breve y cercano. Si pide un cambio (hora, precio, lugar, fecha, título), usa "actualizar_evento" con el id correcto. Cancelar → "cancelar_evento". Reactivar → "reactivar_evento". Para CREAR un evento nuevo, dile que te envíe el flyer como foto. No inventes eventos ni datos. Si no tienes claro a qué evento se refiere, pregúntale antes de actuar.`;

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
