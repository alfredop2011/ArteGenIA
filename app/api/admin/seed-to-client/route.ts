import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdmin } from "@/lib/admin";
import { uploadToR2 } from "@/lib/r2";

/**
 * POST /api/admin/seed-to-client
 *
 * Onboarding asistido (P1.T3). Un admin diseña un flyer con los datos del
 * cliente y lo guarda directamente en la galería "Mis creaciones" de ese
 * cliente. Si la cuenta del cliente no existe todavía, se crea + se le envía
 * una invitación por email (Supabase invite, entregado vía SMTP Resend).
 *
 * Body:
 *   {
 *     clientEmail: string,          // email del cliente
 *     title: string,                // título del flyer (ej. "Tardeo SBK · 16 may")
 *     templateId?: number | null,   // id de la plantilla base (para trazar)
 *     fabricJson: object,           // canvas serializado (canvas.toJSON del editor)
 *     thumbnailDataUrl?: string,    // PNG dataUrl para la miniatura de la card
 *     format?: string,              // "portrait" | "square" | ...
 *     width?: number,
 *     height?: number,
 *   }
 *
 * Devuelve: { ok, clientUserId, invited, projectId }
 * Solo admins.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      clientEmail,
      title,
      templateId = null,
      fabricJson,
      thumbnailDataUrl,
      format = "portrait",
      width = 1080,
      height = 1350,
    } = body as {
      clientEmail?: string;
      title?: string;
      templateId?: number | null;
      fabricJson?: object;
      thumbnailDataUrl?: string;
      format?: string;
      width?: number;
      height?: number;
    };

    const email = (clientEmail ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Email de cliente inválido" }, { status: 400 });
    }
    if (!fabricJson || typeof fabricJson !== "object") {
      return NextResponse.json({ error: "fabricJson requerido" }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "title requerido" }, { status: 400 });
    }

    // ── 1. Find-or-invite del cliente ────────────────────────────────────
    let clientUserId: string | null = null;
    let invited = false;

    // Busca por email en profiles (existe columna email).
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existing?.id) {
      clientUserId = existing.id as string;
    } else {
      // No existe → invitar. Supabase crea el auth.user + envía email de
      // invitación (custom SMTP Resend). El link lleva a /auth/callback.
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://artegenia.com";
      const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { redirectTo: `${appUrl}/auth/callback` },
      );
      if (inviteErr || !inviteData?.user) {
        console.error("[seed-to-client] invite error:", inviteErr);
        return NextResponse.json(
          { error: `No se pudo invitar al cliente: ${inviteErr?.message ?? "unknown"}` },
          { status: 500 },
        );
      }
      clientUserId = inviteData.user.id;
      invited = true;
    }

    if (!clientUserId) {
      return NextResponse.json({ error: "No se pudo resolver la cuenta del cliente" }, { status: 500 });
    }

    // ── 2. Subir thumbnail a R2 (opcional) ───────────────────────────────
    let thumbnailUrl: string | null = null;
    if (typeof thumbnailDataUrl === "string" && thumbnailDataUrl.startsWith("data:image")) {
      try {
        const match = thumbnailDataUrl.match(/^data:image\/(png|jpeg);base64,(.+)$/);
        if (match) {
          const ext = match[1] === "jpeg" ? "jpg" : match[1];
          const buffer = Buffer.from(match[2], "base64");
          const key = `client-flyers/${clientUserId}-${Date.now()}.${ext}`;
          const res = await uploadToR2(buffer, key, `image/${match[1]}`);
          thumbnailUrl = res.url;
        }
      } catch (e) {
        console.warn("[seed-to-client] thumbnail upload failed (no bloquea):", e);
      }
    }

    // ── 3. Insertar el project en la galería del cliente ─────────────────
    // supabaseAdmin salta RLS → puede insertar en nombre de otro user_id.
    const { data: created, error: insertErr } = await supabaseAdmin
      .from("projects")
      .insert({
        user_id: clientUserId,
        title: title.trim(),
        template_id: templateId,
        fabric_json: fabricJson,
        format,
        width,
        height,
        thumbnail_url: thumbnailUrl,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[seed-to-client] insert project error:", insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      clientUserId,
      invited,
      projectId: created.id,
    });
  } catch (e) {
    console.error("[seed-to-client]", e);
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
