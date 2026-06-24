/**
 * WhatsApp Cloud API (Meta) — cliente genérico para envío de templates
 * y verificación de firmas de webhook.
 *
 * Estrategia de robustez:
 *   - Si faltan env vars (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN),
 *     todas las funciones devuelven { sent: false, reason: "config_missing" }
 *     SIN tirar excepciones — el caller decide qué hacer (loguear + seguir).
 *   - Errores de Meta (400, 401, 429, 500) NO se rethrowan; se devuelven
 *     estructurados para que el caller pueda registrar/reintentar.
 *   - Timeout de 10s para que no bloquee el endpoint que nos llama.
 *
 * Templates aprobados en v1 (deben existir en Meta antes de llamar):
 *   - phone_otp_v1                  (Authentication) → 1 variable: el código
 *   - collaborator_photo_received_v1 (Utility)      → 4 vars + 1 button-url var
 *
 * Setup completo: docs/whatsapp-cloud-api-setup.md
 */

import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

const META_GRAPH_VERSION = "v23.0";
const META_API_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;
const TIMEOUT_MS = 10_000;

export type WhatsappSendResult =
    | { sent: true; messageId: string }
    | { sent: false; reason: "config_missing" }
    | { sent: false; reason: "api_error"; status: number; message: string }
    | { sent: false; reason: "timeout" }
    | { sent: false; reason: "network_error"; message: string };

type TemplateComponent =
    | {
          type: "header";
          parameters: Array<{ type: "text"; text: string }>;
      }
    | {
          type: "body";
          parameters: Array<{ type: "text"; text: string }>;
      }
    | {
          type: "button";
          sub_type: "url";
          index: string;
          parameters: Array<{ type: "text"; text: string }>;
      };

/**
 * Lee config del entorno. Devuelve null si falta alguna var crítica —
 * el caller debe interpretarlo como "no enviar, registrar y seguir".
 */
function getConfig(): { phoneNumberId: string; accessToken: string } | null {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!phoneNumberId || !accessToken) return null;
    return { phoneNumberId, accessToken };
}

/**
 * Normaliza un teléfono a E.164 sin + (formato que pide Meta).
 *   "+34 666 12 34 56" → "34666123456"
 *   "666 12 34 56" → "34666123456" (asume España si <11 dígitos)
 *
 * No es validación exhaustiva — solo limpieza para no rechazar números
 * con espacios/guiones. La validación real la hace Meta y devuelve error.
 */
export function normalizePhoneE164(raw: string): string {
    const cleaned = raw.replace(/[^\d]/g, "");
    if (cleaned.length === 9 && (cleaned[0] === "6" || cleaned[0] === "7")) {
        // móvil español sin prefijo
        return `34${cleaned}`;
    }
    return cleaned;
}

/**
 * Envía un template a un teléfono. Es la primitiva — los helpers específicos
 * (sendPhoneOtp, sendCollaboratorPhotoReceived) la llaman con sus
 * componentes pre-construidos.
 *
 * @param to     Teléfono destino (se normaliza automáticamente)
 * @param name   Nombre exacto del template aprobado en Meta
 * @param language ISO 639-1 + región (es, es_ES, en_US…)
 * @param components Componentes con variables (header/body/button)
 */
export async function sendWhatsappTemplate(
    to: string,
    name: string,
    language: string,
    components: TemplateComponent[],
): Promise<WhatsappSendResult> {
    const config = getConfig();
    if (!config) {
        console.warn("[whatsapp] config_missing — no se enviará a", to, "template", name);
        return { sent: false, reason: "config_missing" };
    }

    const phone = normalizePhoneE164(to);
    if (phone.length < 8) {
        return { sent: false, reason: "api_error", status: 400, message: "phone_invalid" };
    }

    const body = {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
            name,
            language: { code: language },
            components,
        },
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${META_API_BASE}/${config.phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });

        const text = await res.text().catch(() => "");
        if (!res.ok) {
            console.error("[whatsapp] api_error", res.status, text);
            return {
                sent: false,
                reason: "api_error",
                status: res.status,
                message: text.slice(0, 500),
            };
        }

        const parsed = JSON.parse(text) as {
            messages?: Array<{ id?: string }>;
        };
        const messageId = parsed.messages?.[0]?.id ?? "unknown";
        return { sent: true, messageId };
    } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
            console.error("[whatsapp] timeout after", TIMEOUT_MS, "ms");
            return { sent: false, reason: "timeout" };
        }
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[whatsapp] network_error", msg);
        return { sent: false, reason: "network_error", message: msg };
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Helpers específicos por template ─────────────────────────────────────

/**
 * Manda código OTP de 6 dígitos para verificar el teléfono del user.
 * Template `phone_otp_v1` (Authentication category — gratis).
 */
export async function sendPhoneOtp(to: string, code: string): Promise<WhatsappSendResult> {
    return sendWhatsappTemplate(to, "phone_otp_v1", "es", [
        {
            type: "body",
            parameters: [{ type: "text", text: code }],
        },
    ]);
}

/**
 * Manda al organizador la notificación de que un colaborador subió su foto.
 * Template `collaborator_photo_received_v1` (Utility category — ~$0.03/conv).
 *
 * @param ownerName       Nombre del organizador (puede ser corto, ej "Alfredo")
 * @param collaboratorName Nombre del colaborador que subió la foto
 * @param projectTitle    Título del flyer ("Festival Bass Revolution" o "tu flyer")
 * @param statusLine      Línea de status: "Ya está colocada en su slot" o "Quedan 2 fotos pendientes"
 * @param projectId       UUID del proyecto — se usa en la URL del botón "Abrir flyer"
 */
export async function sendCollaboratorPhotoReceivedWhatsapp(
    to: string,
    ownerName: string,
    collaboratorName: string,
    projectTitle: string,
    statusLine: string,
    projectId: string,
): Promise<WhatsappSendResult> {
    // Sanitizar: Meta rechaza si las variables tienen \n, \t, ni >1024 chars
    const sanitize = (s: string) => s.replace(/[\n\t]+/g, " ").trim().slice(0, 200);
    return sendWhatsappTemplate(to, "collaborator_photo_received_v1", "es", [
        {
            type: "body",
            parameters: [
                { type: "text", text: sanitize(ownerName || "Hola") },
                { type: "text", text: sanitize(collaboratorName) },
                { type: "text", text: sanitize(projectTitle) },
                { type: "text", text: sanitize(statusLine) },
            ],
        },
        {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: projectId }],
        },
    ]);
}

// ─── Webhook signature verification ────────────────────────────────────────

/**
 * Verifica la firma X-Hub-Signature-256 que Meta añade a los webhooks
 * para garantizar que el POST viene realmente de ellos y no de un
 * atacante random pegándole a nuestro endpoint público.
 *
 * Meta usa HMAC-SHA256 con WHATSAPP_APP_SECRET como clave sobre el
 * body raw (no parseado). Sin esto, cualquiera podría inyectar eventos
 * falsos en nuestro sistema.
 */
export function verifyWhatsappWebhookSignature(
    rawBody: string,
    signatureHeader: string | null,
): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
        // Sin secret no podemos verificar — en dev devolvemos true para
        // poder testear localmente; en producción esto se considera fallo
        // de config y el endpoint debería rechazar todos los webhooks.
        if (process.env.NODE_ENV === "production") {
            console.error("[whatsapp] WHATSAPP_APP_SECRET missing en producción — rechazando webhook");
            return false;
        }
        console.warn("[whatsapp] WHATSAPP_APP_SECRET missing — saltando verificación en dev");
        return true;
    }
    if (!signatureHeader) return false;

    const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");
    try {
        const a = Buffer.from(signatureHeader);
        const b = Buffer.from(expected);
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

/**
 * Devuelve el verify token configurado para el handshake inicial del webhook
 * (cuando Meta hace GET /api/webhooks/whatsapp?hub.verify_token=...).
 */
export function getWebhookVerifyToken(): string | null {
    return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ?? null;
}

/**
 * Genera un OTP de 6 dígitos criptográficamente seguro.
 * (no usamos Math.random porque es predecible).
 */
export function generateOtpCode(): string {
    // randomBytes en lugar de Math.random (este último es predecible)
    const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
    return n.toString().padStart(6, "0");
}
