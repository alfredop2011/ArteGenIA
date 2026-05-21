import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Endpoints para gestionar un colaborador individual.
 *  - DELETE: derecho al olvido. Borra fila + foto en R2.
 *  - PATCH:  edición restringida según tipo:
 *      * person → solo el campo `role` (metadata del organizador)
 *      * brand  → cualquier campo (no es persona física, RGPD no aplica)
 */

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function extractR2Key(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  const publicBase = process.env.R2_PUBLIC_URL ?? "";
  if (!publicBase || !photoUrl.startsWith(publicBase)) return null;
  return photoUrl.slice(publicBase.length).replace(/^\//, "");
}

// ─── DELETE ──────────────────────────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Verificar que es del usuario y obtener photo_url para borrar de R2
  const { data: collab, error: getErr } = await supabase
    .from("collaborators")
    .select("id, photo_url")
    .eq("id", id)
    .maybeSingle();

  if (getErr || !collab) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Borrar foto de R2 (best-effort)
  const key = extractR2Key(collab.photo_url);
  if (key) {
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      }));
    } catch (e) {
      console.error("[collab DELETE] R2 failure (non-fatal)", e);
    }
  }

  const { error: delErr } = await supabase
    .from("collaborators")
    .delete()
    .eq("id", id);

  if (delErr) {
    console.error("[collab DELETE]", delErr);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// ─── PATCH ───────────────────────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();

  // Necesitamos saber el kind para validar qué se puede tocar
  const { data: existing, error: getErr } = await supabase
    .from("collaborators")
    .select("id, kind")
    .eq("id", id)
    .maybeSingle();

  if (getErr || !existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Whitelist de campos editables por tipo
  const allowed: Record<string, true> = {};
  if (existing.kind === "person") {
    allowed.role = true;
  } else if (existing.kind === "brand") {
    allowed.artist_name = true;
    allowed.role        = true;
    // photo_url se gestiona aparte (subida de archivo), no por PATCH JSON
  }

  const updates: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (allowed[key]) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Ningún campo editable proporcionado" },
      { status: 400 }
    );
  }

  // Trim de strings
  for (const k of Object.keys(updates)) {
    if (typeof updates[k] === "string") {
      updates[k] = (updates[k] as string).trim() || null;
    }
  }

  // Auditoría: marcamos cuándo el organizador modificó la fila
  updates.updated_by_owner_at = new Date().toISOString();
  updates.updated_at = new Date().toISOString();

  // Usamos supabaseAdmin para saltarnos RLS (igual valida que es del user por el SELECT previo)
  // pero como tenemos RLS UPDATE habilitada, también funciona con `supabase`. Mantenemos `supabase` por RLS.
  const { error: updErr } = await supabase
    .from("collaborators")
    .update(updates)
    .eq("id", id);

  if (updErr) {
    console.error("[collab PATCH]", updErr);
    return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
