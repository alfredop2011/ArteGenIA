import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { uploadToR2 } from "@/lib/r2";

/**
 * POST /api/collaborators
 * Recibe el registro de un colaborador (persona o marca).
 *
 * Si el invite tiene `updates_collaborator_id` distinto de NULL, en lugar de
 * crear una fila nueva, se ACTUALIZA la existente (flujo de re-invitación).
 *
 * Campos comunes:
 *   - token  (requerido)
 *   - kind   ("person" | "brand", requerido)
 *   - photo  (File, requerido)
 *
 * Persona:
 *   - artist_name (requerido)
 *   - role, phone (opcionales)
 *   - consent_accepted, consent_text (requeridos)
 *
 * Marca:
 *   - artist_name (requerido)
 *   - sin teléfono ni consentimiento
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

    if (!token)      return NextResponse.json({ error: "Falta token" }, { status: 400 });
    if (!artistName) return NextResponse.json({ error: "Falta nombre" }, { status: 400 });
    if (!photo)      return NextResponse.json({ error: "Falta imagen" }, { status: 400 });
    if (!photo.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo imágenes" }, { status: 400 });
    }
    if (photo.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Máximo 5MB" }, { status: 400 });
    }
    if (kindRaw !== "person" && kindRaw !== "brand") {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }
    const kind = kindRaw as "person" | "brand";

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
      .select("token, owner_id, expires_at, used_at, updates_collaborator_id")
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

    // Subir imagen a R2 (con compresión defensiva server-side)
    const safeName = artistName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    const prefix = kind === "brand" ? "brands" : "collaborators";
    const inputBytes = Buffer.from(await photo.arrayBuffer());

    let outBytes: Buffer;
    let outMime: string;
    let outExt: string;

    try {
      if (kind === "brand") {
        // Marcas: PNG 800px preservando transparencia
        outBytes = await sharp(inputBytes)
          .rotate()
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .png({ compressionLevel: 9 })
          .toBuffer();
        outMime = "image/png";
        outExt = "png";
      } else {
        // Personas: JPEG 1080px 80%
        outBytes = await sharp(inputBytes)
          .rotate()
          .resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer();
        outMime = "image/jpeg";
        outExt = "jpg";
      }
    } catch (sharpErr) {
      console.warn("[collaborators POST] sharp failed, using original:", sharpErr);
      outBytes = inputBytes;
      outMime = photo.type;
      outExt = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    }

    const key = `${prefix}/${invite.owner_id}/${token}-${safeName}.${outExt}`;
    const { url: photoUrl } = await uploadToR2(outBytes, key, outMime);

    const ip = kind === "person"
      ? (req.headers.get("x-forwarded-for")?.split(",")[0].trim()
         || req.headers.get("x-real-ip")
         || null)
      : null;

    const payload = {
      owner_id: invite.owner_id,
      kind,
      artist_name: artistName,
      role,
      phone: kind === "person" ? phone : null,
      photo_url: photoUrl,
      consent_text: kind === "person" ? consentText : null,
      consent_at: kind === "person" ? new Date().toISOString() : null,
      consent_ip: ip,
    };

    let collabId: string;

    if (invite.updates_collaborator_id) {
      // ── Flujo de RE-INVITACIÓN: actualizar fila existente ─────────────
      // Verificamos que esa fila siga existiendo y sea del mismo owner
      const { data: target, error: tgtErr } = await supabaseAdmin
        .from("collaborators")
        .select("id, owner_id, kind")
        .eq("id", invite.updates_collaborator_id)
        .maybeSingle();

      if (tgtErr || !target) {
        return NextResponse.json(
          { error: "El colaborador a actualizar ya no existe" },
          { status: 410 }
        );
      }
      if (target.owner_id !== invite.owner_id) {
        return NextResponse.json({ error: "Token incoherente" }, { status: 403 });
      }
      // Solo permitimos re-invitación de personas (consistencia con reinvite endpoint)
      if (target.kind !== "person" || kind !== "person") {
        return NextResponse.json(
          { error: "La re-invitación solo aplica a personas" },
          { status: 400 }
        );
      }

      const { error: updErr } = await supabaseAdmin
        .from("collaborators")
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invite.updates_collaborator_id);

      if (updErr) {
        console.error("[collaborators POST update]", updErr);
        return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
      }

      collabId = invite.updates_collaborator_id;
    } else {
      // ── Flujo NORMAL: insertar nuevo colaborador ──────────────────────
      const { data: collab, error: collabErr } = await supabaseAdmin
        .from("collaborators")
        .insert(payload)
        .select("id")
        .single();

      if (collabErr || !collab) {
        console.error("[collaborators POST insert]", collabErr);
        return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
      }

      collabId = collab.id;
    }

    // Marcar invite como usado
    await supabaseAdmin
      .from("collaborator_invites")
      .update({
        used_at: new Date().toISOString(),
        collaborator_id: collabId,
      })
      .eq("token", token);

    return NextResponse.json({ ok: true, collaboratorId: collabId });
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
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supabase
    .from("collaborators")
    .select("id, kind, artist_name, role, phone, photo_url, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[collaborators GET]", error);
    return NextResponse.json({ error: "Error al listar" }, { status: 500 });
  }

  return NextResponse.json({ collaborators: data ?? [] });
}
