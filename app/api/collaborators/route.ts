import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";
import { sendCollaboratorPhotoReceivedEmail } from "@/lib/email";

/**
 * Auto-actualiza el fabric_json de un project reemplazando el `src` del
 * layer cuyo `customId === targetLayerId`. Se invoca cuando un invite
 * "contextual" (generado desde el editor) completa la subida del colaborador.
 *
 * - Idempotente: si el layer no se encuentra, devuelve false sin error.
 * - Defensivo: cualquier excepción se loguea pero NO rompe el flujo
 *   principal de POST /api/collaborators (el colaborador ya está guardado
 *   y queda accesible desde /mis-recursos).
 */
async function patchProjectLayer(
  projectId: string,
  targetLayerId: string,
  newUrl: string,
  collaboratorName: string,
  photoSize: { width: number; height: number } | null,
): Promise<boolean> {
  try {
    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .select("id, fabric_json")
      .eq("id", projectId)
      .maybeSingle();
    if (error || !project?.fabric_json) {
      console.warn("[patchProjectLayer] project not found or no fabric_json", { projectId, error });
      return false;
    }

    const fj = project.fabric_json as { objects?: Array<Record<string, unknown>> };
    if (!Array.isArray(fj.objects)) {
      console.warn("[patchProjectLayer] fabric_json has no objects array", { projectId });
      return false;
    }

    let touched = false;
    const nowIso = new Date().toISOString();
    // Cache buster para que el navegador NO use una imagen cacheada del src
    // antiguo (caso raro: si el customId estaba en una URL R2 reutilizada).
    const cacheBuster = `?v=${Date.now()}`;
    const srcWithBuster = newUrl + cacheBuster;
    // Recopilamos customIds disponibles para debug si no encontramos match
    const availableIds: string[] = [];
    for (const obj of fj.objects) {
      if (obj.customId) availableIds.push(`${obj.customId}(${obj.type})`);
      // Match RELAJADO: customId coincide Y es image. Antes filtraba ESTRICTO
      // por type === "image"; ahora también aceptamos cualquier tipo si el
      // customId coincide y el objeto tiene `src` (cubre FabricImage que en
      // serialización a veces aparece como type "Image" con I mayúscula).
      const customIdMatch = obj.customId === targetLayerId;
      const hasSrc = "src" in obj;
      const looksLikeImage = obj.type === "image" || obj.type === "Image" || hasSrc;
      if (customIdMatch && looksLikeImage) {
        // Calcular tamaño VISIBLE del slot ANTES de cambiar el src.
        // Esto es lo que ocupaba la foto vieja en el canvas, y es lo
        // que queremos que ocupe la nueva (preserva el layout).
        const oldWidth = typeof obj.width === "number" ? obj.width : 0;
        const oldHeight = typeof obj.height === "number" ? obj.height : 0;
        const oldScaleX = typeof obj.scaleX === "number" ? obj.scaleX : 1;
        const oldScaleY = typeof obj.scaleY === "number" ? obj.scaleY : 1;
        const visibleWidth = oldWidth * oldScaleX;
        const visibleHeight = oldHeight * oldScaleY;

        obj.src = srcWithBuster;
        obj.crossOrigin = "anonymous";

        const isExtraSlot = typeof obj.customId === "string" && obj.customId.startsWith("extra-slot-");
        if (isExtraSlot) {
          // Extra-slot: limpiar visuales del placeholder morado.
          obj.backgroundColor = "";
          obj.stroke = "";
          obj.strokeWidth = 0;
          obj.strokeDashArray = null;
          // El placeholder era PNG 1x1 con scaleX=scaleY=240 → ocupaba
          // 240x240 visualmente. Si solo reseteamos scale a 1 sin tocar
          // width/height (que eran 1px), la foto recibida se renderiza
          // a 1x1 = invisible. Aplicamos object-fit cover sobre 240x240
          // visible target (igual que slots de plantilla, pero con
          // tamaño fijo en vez de leerlo del bbox original).
          if (photoSize && photoSize.width > 0 && photoSize.height > 0) {
            const targetSize = Math.max(visibleWidth, visibleHeight, 240);
            obj.width = photoSize.width;
            obj.height = photoSize.height;
            const scaleCover = Math.max(
              targetSize / photoSize.width,
              targetSize / photoSize.height,
            );
            obj.scaleX = scaleCover;
            obj.scaleY = scaleCover;
          } else {
            // Sin photoSize (fallback): asumimos foto cuadrada 800x800
            // y reseteamos scale a algo razonable para que no quede 1x1.
            obj.scaleX = 0.3;
            obj.scaleY = 0.3;
          }
        } else if (photoSize && photoSize.width > 0 && photoSize.height > 0 && visibleWidth > 0 && visibleHeight > 0) {
          // Slot de PLANTILLA: calcular scale para que la nueva foto
          // OCUPE EXACTAMENTE el mismo área visible que la foto vieja
          // (object-fit: cover). Esto evita el bug de fotos cortadas
          // cuando la nueva imagen tiene aspect ratio distinto a la
          // de la plantilla (ej. logo horizontal en slot retrato).
          //
          // 1. Las dimensions del objeto pasan a ser las naturales de
          //    la nueva foto (Fabric las usa al renderizar).
          // 2. Calculamos scale como MAX(visibleW/photoW, visibleH/photoH)
          //    = cover (la foto cubre todo el bbox, sobra recortado).
          // 3. NO tocamos left/top (la foto queda en la misma posición).
          obj.width = photoSize.width;
          obj.height = photoSize.height;
          const scaleCover = Math.max(
            visibleWidth / photoSize.width,
            visibleHeight / photoSize.height,
          );
          obj.scaleX = scaleCover;
          obj.scaleY = scaleCover;
        }

        obj.collaboratorReceivedAt = nowIso;
        obj.collaboratorName = collaboratorName;
        touched = true;
      }
    }
    if (!touched) {
      console.warn("[patchProjectLayer] no layer matched", {
        projectId,
        targetLayerId,
        availableIds,
      });
      return false;
    }

    const { error: updErr } = await supabaseAdmin
      .from("projects")
      .update({ fabric_json: fj, updated_at: new Date().toISOString() })
      .eq("id", projectId);
    if (updErr) {
      console.error("[collaborators auto-patch] update failed", updErr);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[collaborators auto-patch] exception", e);
    return false;
  }
}

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

    // Validar token (incluye contexto editor: project_id + target_layer_id)
    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from("collaborator_invites")
      .select("token, owner_id, expires_at, used_at, updates_collaborator_id, project_id, target_layer_id")
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
      // Detectar si la imagen tiene canal alpha (transparencia)
      const meta = await sharp(inputBytes).metadata();
      const hasAlpha = meta.hasAlpha === true;

      if (kind === "brand") {
        // Marcas: SIEMPRE PNG 800px preservando transparencia
        outBytes = await sharp(inputBytes)
          .rotate()
          .resize(800, 800, { fit: "inside", withoutEnlargement: true })
          .png({ compressionLevel: 9 })
          .toBuffer();
        outMime = "image/png";
        outExt = "png";
      } else if (hasAlpha) {
        // Persona CON transparencia (foto ya recortada sin fondo): PNG
        outBytes = await sharp(inputBytes)
          .rotate()
          .resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
          .png({ compressionLevel: 9 })
          .toBuffer();
        outMime = "image/png";
        outExt = "png";
      } else {
        // Persona SIN transparencia (foto normal): JPEG 1080px 80%
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

    // Leer dimensions reales de la foto procesada. Necesarias para que
    // patchProjectLayer calcule el scale correcto al meterla en el slot
    // del flyer (sin esto, la foto se ve cortada si el aspect ratio no
    // coincide con el slot original de la plantilla).
    let photoSize: { width: number; height: number } | null = null;
    try {
      const photoMeta = await sharp(outBytes).metadata();
      if (typeof photoMeta.width === "number" && typeof photoMeta.height === "number") {
        photoSize = { width: photoMeta.width, height: photoMeta.height };
      }
    } catch (sizeErr) {
      console.warn("[collaborators POST] could not read photo size:", sizeErr);
    }

    /** Limpia el archivo R2 que acabamos de subir si el INSERT/UPDATE
     *  falla más abajo. Sin esto el archivo queda huérfano (el cron de
     *  cleanup lo pesca eventualmente, pero mejor evitar la acumulación).
     *  Best-effort: si el DELETE de R2 falla, log y seguimos — no rompe
     *  la respuesta del cliente. */
    const cleanupUpload = async () => {
      try { await deleteFromR2(key); } catch (e) {
        console.warn("[collaborators POST] huérfano R2 sin borrar:", key, e);
      }
    };

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
        await cleanupUpload();
        return NextResponse.json(
          { error: "El colaborador a actualizar ya no existe" },
          { status: 410 }
        );
      }
      if (target.owner_id !== invite.owner_id) {
        await cleanupUpload();
        return NextResponse.json({ error: "Token incoherente" }, { status: 403 });
      }
      // Solo permitimos re-invitación de personas (consistencia con reinvite endpoint)
      if (target.kind !== "person" || kind !== "person") {
        await cleanupUpload();
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
        await cleanupUpload();
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
        await cleanupUpload();
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

    // ── Invite contextual: auto-actualizar fabric_json del project + email ──
    // Esto solo se ejecuta si el invite fue generado desde el editor con el
    // botón "Solicitar foto". Todo va en best-effort: si falla, el colaborador
    // ya está guardado y el owner puede insertar la foto manualmente desde
    // /mis-recursos.
    let projectPatched = false;
    if (invite.project_id && invite.target_layer_id) {
      // photoUrl ya está disponible: es la URL pública R2 retornada por
      // uploadToR2() arriba en este mismo handler.
      projectPatched = await patchProjectLayer(
        invite.project_id,
        invite.target_layer_id,
        photoUrl,
        artistName,
        photoSize,
      );

      // Notificar al owner — email (siempre que pref esté activa) +
      // WhatsApp (cuando esté lista la integración + pref activa + tel verif).
      try {
        const { data: ownerProfile } = await supabaseAdmin
          .from("profiles")
          .select("email, name, phone, phone_verified_at, notification_prefs")
          .eq("id", invite.owner_id)
          .maybeSingle();
        const { data: proj } = await supabaseAdmin
          .from("projects")
          .select("id, title")
          .eq("id", invite.project_id)
          .maybeSingle();
        const realTitle = proj?.title && proj.title !== "Diseño sin título"
          ? proj.title
          : null;

        // Defaults defensivos para perfiles legacy sin notification_prefs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prefs = (ownerProfile?.notification_prefs as any) ?? {
          email: { foto_recibida: true },
          whatsapp: { foto_recibida: false },
        };
        const wantsEmail = prefs?.email?.foto_recibida !== false;
        const wantsWhatsapp = prefs?.whatsapp?.foto_recibida === true;

        if (wantsEmail && ownerProfile?.email) {
          await sendCollaboratorPhotoReceivedEmail(
            ownerProfile.email,
            ownerProfile.name,
            artistName,
            realTitle,
            invite.project_id,
            projectPatched,
          );
        }

        // WhatsApp: stub hasta que integremos provider (Twilio/Cloud API).
        // Por ahora solo logueamos para que quede traza de que la pref
        // está activa y sabemos a quién deberíamos haber notificado.
        if (wantsWhatsapp && ownerProfile?.phone && ownerProfile?.phone_verified_at) {
          console.log("[collaborators POST] would send WhatsApp to", ownerProfile.phone, "for project", invite.project_id);
          // TODO(whatsapp): cuando esté el provider, llamar:
          //   await sendCollaboratorPhotoReceivedWhatsapp(phone, name, artist, title, projectId)
        }

        // Notificación in-app (campana) — SIEMPRE se crea, independiente
        // de prefs email/whatsapp. La campana es el canal "siempre on"
        // que el user ve al volver a la app sin haber leído notificaciones
        // externas. Si el user quiere apagarla en el futuro, añadimos pref
        // notification_prefs.inapp.foto_recibida.
        const { error: notifErr } = await supabaseAdmin
          .from("notifications")
          .insert({
            user_id: invite.owner_id,
            type: "collaborator_photo_received",
            payload: {
              collaborator_name: artistName,
              project_id: invite.project_id,
              project_title: realTitle,
              auto_applied: projectPatched,
              photo_url: photoUrl,
            },
          });
        if (notifErr) {
          console.warn("[collaborators POST] notification insert failed:", notifErr);
        }
      } catch (mailErr) {
        console.warn("[collaborators POST] notification owner failed:", mailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      collaboratorId: collabId,
      projectPatched,
    });
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
