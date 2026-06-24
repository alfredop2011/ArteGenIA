import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateOtpCode, normalizePhoneE164, sendPhoneOtp } from "@/lib/whatsapp";

/**
 * POST /api/account/phone/send-otp
 *
 * Body: { phone: string }
 *
 * Flow:
 *   1. Auth check
 *   2. Normaliza el teléfono a E.164 sin '+'
 *   3. Rate limit: cooldown 60s, max 10/día por user
 *   4. Genera código 6 dígitos (criptográficamente seguro)
 *   5. Upsert en phone_verifications (sobrescribe el OTP anterior si existía)
 *   6. Manda template phone_otp_v1 por Cloud API
 *   7. Si Cloud API falla, borra la fila y devuelve error al user
 *
 * Si las env vars de Meta no están (setup pendiente), devolvemos 503 con
 * mensaje claro — el frontend muestra "WhatsApp no disponible aún".
 */

const COOLDOWN_SECONDS = 60;
const MAX_PER_DAY = 10;
const OTP_TTL_MINUTES = 10;

export async function POST(req: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as { phone?: string } | null;
    if (!body?.phone || typeof body.phone !== "string") {
        return NextResponse.json({ error: "Falta el teléfono" }, { status: 400 });
    }

    const phoneE164 = normalizePhoneE164(body.phone);
    if (phoneE164.length < 8 || phoneE164.length > 15) {
        return NextResponse.json(
            { error: "Teléfono inválido. Usa formato internacional (ej. +34 666 12 34 56)" },
            { status: 400 },
        );
    }

    // ─── Rate limit: 60s entre envíos ────────────────────────────────────
    const cooldownThreshold = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();
    const { data: recent } = await supabaseAdmin
        .from("phone_verifications")
        .select("sent_at")
        .eq("user_id", user.id)
        .gt("sent_at", cooldownThreshold)
        .limit(1)
        .maybeSingle();
    if (recent) {
        return NextResponse.json(
            { error: `Espera ${COOLDOWN_SECONDS}s entre envíos. Si no te llegó, revisa el número.` },
            { status: 429 },
        );
    }

    // ─── Rate limit: 10 OTPs/día por user (anti-abuso) ──────────────────
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: todayCount } = await supabaseAdmin
        .from("phone_verifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gt("sent_at", dayAgo);
    if ((todayCount ?? 0) >= MAX_PER_DAY) {
        return NextResponse.json(
            { error: "Has superado el máximo de envíos diarios. Vuelve mañana." },
            { status: 429 },
        );
    }

    // ─── Generar OTP + guardar (upsert sobre el anterior si existía) ────
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
    const sentAt = new Date().toISOString();

    // Borramos cualquier OTP previo pendiente del user (UNIQUE INDEX impide
    // tener 2 activos a la vez, así que limpiar primero es lo más simple).
    await supabaseAdmin
        .from("phone_verifications")
        .delete()
        .eq("user_id", user.id)
        .is("verified_at", null);

    const { error: insertErr } = await supabaseAdmin
        .from("phone_verifications")
        .insert({
            user_id: user.id,
            phone: phoneE164,
            code,
            attempts: 0,
            sent_at: sentAt,
            expires_at: expiresAt,
        });
    if (insertErr) {
        console.error("[send-otp] insert error", insertErr);
        return NextResponse.json({ error: "No se pudo generar el código" }, { status: 500 });
    }

    // ─── Mandar por Cloud API ────────────────────────────────────────────
    const result = await sendPhoneOtp(phoneE164, code);
    if (!result.sent) {
        // Rollback: borramos la fila si no se mandó (no queremos que el user
        // tenga un código activo que nunca recibió).
        await supabaseAdmin
            .from("phone_verifications")
            .delete()
            .eq("user_id", user.id)
            .eq("code", code);

        if (result.reason === "config_missing") {
            return NextResponse.json(
                { error: "WhatsApp aún no está activo. Recibirás notificaciones por email." },
                { status: 503 },
            );
        }
        console.error("[send-otp] sendPhoneOtp failed", result);
        return NextResponse.json(
            { error: "No pudimos enviarte el código. Verifica el número e intenta de nuevo." },
            { status: 502 },
        );
    }

    return NextResponse.json({
        ok: true,
        phone_e164: `+${phoneE164}`,
        expires_in_seconds: OTP_TTL_MINUTES * 60,
        message_id: result.messageId,
    });
}
