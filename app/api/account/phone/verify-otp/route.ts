import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/account/phone/verify-otp
 *
 * Body: { code: string }  (6 dígitos)
 *
 * Flow:
 *   1. Auth check
 *   2. Lee el OTP pendiente del user (no expirado, no verificado)
 *   3. Si no hay → 404
 *   4. Si attempts >= 3 → borrar fila + 429 ("código bloqueado, pide otro")
 *   5. Si code coincide → marca verified_at + profiles.phone + phone_verified_at
 *      + borra la fila de phone_verifications (ya no se necesita)
 *   6. Si no coincide → attempts++ + 401
 *
 * Notas:
 *   - No revelamos cuántos intentos quedan a propósito (anti-brute force).
 *   - El phone se copia del OTP a profiles, NUNCA del body (defensa en
 *     profundidad: el user solo manda el código; el teléfono ya está fijado
 *     en el OTP que el backend generó).
 */

const MAX_ATTEMPTS = 3;

export async function POST(req: NextRequest) {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as { code?: string } | null;
    const submittedCode = (body?.code ?? "").replace(/\D/g, "");
    if (submittedCode.length !== 6) {
        return NextResponse.json({ error: "El código debe tener 6 dígitos" }, { status: 400 });
    }

    // ─── Buscar OTP activo del user ──────────────────────────────────────
    const { data: otp, error: fetchErr } = await supabaseAdmin
        .from("phone_verifications")
        .select("id, phone, code, attempts, expires_at")
        .eq("user_id", user.id)
        .is("verified_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (fetchErr) {
        console.error("[verify-otp] fetch error", fetchErr);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
    if (!otp) {
        return NextResponse.json(
            { error: "No tienes ningún código activo. Pide uno nuevo." },
            { status: 404 },
        );
    }

    // ─── Bloqueo por intentos ────────────────────────────────────────────
    if (otp.attempts >= MAX_ATTEMPTS) {
        // Borrar la fila para forzar pedir uno nuevo
        await supabaseAdmin.from("phone_verifications").delete().eq("id", otp.id);
        return NextResponse.json(
            { error: "Demasiados intentos fallidos. Pide un código nuevo." },
            { status: 429 },
        );
    }

    // ─── Comparación ─────────────────────────────────────────────────────
    if (submittedCode !== otp.code) {
        const newAttempts = otp.attempts + 1;
        await supabaseAdmin
            .from("phone_verifications")
            .update({ attempts: newAttempts })
            .eq("id", otp.id);
        return NextResponse.json(
            { error: "Código incorrecto" },
            { status: 401 },
        );
    }

    // ─── OK: marcar verified + actualizar profiles ──────────────────────
    const verifiedAt = new Date().toISOString();
    const phoneWithPlus = `+${otp.phone}`;

    const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .update({
            phone: phoneWithPlus,
            phone_verified_at: verifiedAt,
        })
        .eq("id", user.id);
    if (profileErr) {
        console.error("[verify-otp] profile update failed", profileErr);
        return NextResponse.json({ error: "Error guardando el teléfono" }, { status: 500 });
    }

    // Limpieza: borramos el OTP (ya cumplió su misión)
    await supabaseAdmin.from("phone_verifications").delete().eq("id", otp.id);

    return NextResponse.json({
        ok: true,
        phone: phoneWithPlus,
        verified_at: verifiedAt,
    });
}
