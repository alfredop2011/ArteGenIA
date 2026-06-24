import { NextRequest, NextResponse } from "next/server";
import { getWebhookVerifyToken, verifyWhatsappWebhookSignature } from "@/lib/whatsapp";

/**
 * Webhook de WhatsApp Cloud API (Meta).
 *
 * Dos métodos:
 *
 *   GET: Handshake inicial. Meta llama para verificar que poseemos
 *        WHATSAPP_WEBHOOK_VERIFY_TOKEN (el string aleatorio que pusimos
 *        al configurar la URL del webhook). Si coincide, devolvemos el
 *        challenge que nos pasaron como query param.
 *
 *   POST: Eventos reales. Meta nos manda:
 *        - status updates: sent → delivered → read → failed
 *        - mensajes entrantes (no los usamos en v1; el wa.me bot oficial
 *          es para conversación, no este endpoint)
 *        - message_template_status_update: cuando aprueban/rechazan templates
 *
 * En v1 solo logueamos los eventos. Suficiente para depurar entregas. Si
 * más adelante queremos UI ("último WhatsApp entregado a las 14:32"),
 * persistimos en una tabla whatsapp_events.
 *
 * IMPORTANTE: el body se valida con HMAC-SHA256 + WHATSAPP_APP_SECRET
 * para que Meta sea la única que puede llamarnos. Sin esto, cualquiera
 * podría inyectar eventos falsos.
 */

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const expected = getWebhookVerifyToken();
    if (!expected) {
        console.error("[wa-webhook GET] WHATSAPP_WEBHOOK_VERIFY_TOKEN no configurada");
        return new NextResponse("misconfigured", { status: 500 });
    }

    if (mode === "subscribe" && token === expected && challenge) {
        console.log("[wa-webhook GET] handshake OK");
        return new NextResponse(challenge, { status: 200 });
    }

    console.warn("[wa-webhook GET] handshake rejected", { mode, hasToken: !!token, hasChallenge: !!challenge });
    return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
    const signature = req.headers.get("x-hub-signature-256");
    const rawBody = await req.text();

    if (!verifyWhatsappWebhookSignature(rawBody, signature)) {
        console.warn("[wa-webhook POST] signature invalid");
        return new NextResponse("forbidden", { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any = null;
    try {
        body = JSON.parse(rawBody);
    } catch {
        return new NextResponse("bad json", { status: 400 });
    }

    // Estructura típica del payload:
    //   { object: "whatsapp_business_account",
    //     entry: [{ id, changes: [{ value: { statuses?, messages?, ... }, field }] }] }
    const entries = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
        const changes = Array.isArray(entry?.changes) ? entry.changes : [];
        for (const change of changes) {
            const field = change?.field;
            const value = change?.value;
            if (!field || !value) continue;

            if (Array.isArray(value.statuses)) {
                // Status updates: sent/delivered/read/failed
                for (const st of value.statuses) {
                    if (st.status === "failed") {
                        console.error("[wa-webhook] message failed", {
                            id: st.id,
                            recipient: st.recipient_id,
                            errors: st.errors,
                        });
                    } else {
                        console.log("[wa-webhook] status", st.status, "msg:", st.id, "to:", st.recipient_id);
                    }
                }
            }

            if (field === "message_template_status_update") {
                console.log("[wa-webhook] template status", value);
            }

            if (Array.isArray(value.messages)) {
                // Mensajes entrantes (un user respondió). No los procesamos en v1.
                console.log("[wa-webhook] inbound message", value.messages.length, "skipped (v1)");
            }
        }
    }

    // Meta espera 200 OK en menos de 5s o reintenta.
    return new NextResponse("ok", { status: 200 });
}
