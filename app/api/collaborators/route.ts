import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { uploadToR2 } from "@/lib/r2";

/**
 * POST /api/collaborators
 * Recibe el registro de un colaborador (persona o marca).
 *
 * Campos comunes:
 *   - token            (string, requerido)
 *   - kind             ("person" | "brand", requerido)
 *   - photo            (File, requerido) -- foto si persona, logo si marca
 *
 * Si kind === "person":
 *   - artist_name      (requerido)
 *   - role             (opcional)
 *   - phone            (opcional)
 *   - consent_accepted ("true", requerido)
 *   - consent_text     (requerido)
 *
 * Si kind === "brand":
 *   - artist_name      (requerido, es el nombre de la marca)
 *   - No requiere phone, role ni consent (es una entidad, no persona fisica)
 *
 * Usa supabaseAdmin porque el visitante NO esta autenticado.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string | null;
    const kindRaw = formData.get("kind") as string | null;
    const artistName = (formData.get("artist_name") as string | null)?.trim();
    const role = (formData.get("role") as string | null)?.trim() || null;
    const phone = (formData.get("phone") as string | null)?.trim() || null;
    const consentAccepted = formData.get("consent_accepted") === "true";
    const consentText = formData.get("consent_text") as string | null;
    const photo = formData.get("photo") as File | null;

    // Validaciones comunes
    if (!token)        return NextResponse.json({ error: "Falta token" }, { status: 400 });
    if (!artistName)   return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
    if (!photo)        return NextResponse.json({ error: "Falta imagen" }, { status: 400 });
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }
    if (photo.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Máximo 15MB" }, { status: 400 });
    }

    // Validar tipo
    if (kindRaw !== "person" && kindRaw !== "brand") {
      return NextResponse.json({ error: "Tipo de colaborador inválido" }, { status: 400 });
    }
    const kind = kindRaw as "person" | "brand";

    // Validaciones especificas por tipo
    if (kind === "person") {
      if (!consentAccepted) {
        return NextResponse.json({ error: "Debes aceptar el consentimiento" }, { status: 400 });
      }
      if (!consentText) {
        return NextResponse.json({ error: "Falta el texto de consentimiento" }, { status: 400 });
      }
    }

    // Validar token
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from("collaborator_invites")
      .select("token, owner_id, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();

    if (inviteErr || !invite) {
      return NextResponse.json({ error: "Token inválido" }, { status: 404 });
    }
    if (invite.used_at) {
      return NextResponse.json({ error: "Este link ya fue usado" }, { status: 410 });
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Este link ha caducado" }, { status: 410 });
    }

    // Subir imagen a R2
    const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeName = artistName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    const prefix = kind === "brand" ? "brands" : "collaborators";
    const key = `${prefix}/${invite.owner_id}/${token}-${safeName}.${ext}`;
    const bytes = Buffer.from(await photo.arrayBuffer());
    const { url: photoUrl } = await uploadToR2(bytes, key, photo.type);

    // IP para prueba de consentimiento (solo personas)
    const ip = kind === "person"
      ? (req.headers.get("x-forwarded-for")?.split(",")[0].trim()
         || req.headers.get("x-real-ip")
         || null)
      : null;

    // Insertar colaborador
    const { data: collab, error: collabErr } = await supabaseAdmin
      .from("collaborators")
      .insert({
        owner_id: invite.owner_id,
        kind,
        artist_name: artistName,
        role,
        phone: kind === "person" ? phone : null,
        photo_url: photoUrl,
        consent_text: kind === "person" ? consentText : null,
        consent_at: kind === "person" ? new Date().toISOString() : null,
        consent_ip: ip,
      })
      .select("id")
      .single();

    if (collabErr || !collab) {
      console.error("[collaborators POST insert]", collabErr);
      return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
    }

    // Marcar invite como usado
    await supabaseAdmin
      .from("collaborator_invites")
      .update({
        used_at: new Date().toISOString(),
        collaborator_id: collab.id,
      })
      .eq("token", token);

    return NextResponse.json({ ok: true, collaboratorId: collab.id });
  } catch (e) {
    console.error("[collaborators POST]", e);
    return NextResponse.json({ error: "Error procesando la solicitud" }, { status: 500 });
  }
}

/**
 * GET /api/collaborators
 * Lista los colaboradores del usuario logueado (ambos tipos).
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("collaborators")
    .select("id, kind, artist_name, role, phone, photo_url, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[collaborators GET]", error);
    return NextResponse.json({ error: "Error al listar" }, { status: 500 });
  }

  return NextResponse.json({ collaborators: data ?? [] });
}
