import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/account
 * Devuelve el profile completo del usuario autenticado (nombre, email,
 * teléfono, preferencias de notificación). Usado por /cuenta para
 * hidratar el form.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, name, phone, phone_verified_at, notification_prefs, plan")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ error: "No se pudo cargar el perfil" }, { status: 500 });
  }
  // Defaults defensivos por si notification_prefs es null en perfiles
  // legacy (pre-migration). Cliente nunca recibe null.
  const prefs = data.notification_prefs ?? {
    email: { foto_recibida: true, creditos_bajos: true, novedades: false },
    whatsapp: { foto_recibida: false, creditos_bajos: false },
  };
  return NextResponse.json({ ...data, notification_prefs: prefs });
}

type NotificationPrefs = {
  email?: { foto_recibida?: boolean; creditos_bajos?: boolean; novedades?: boolean };
  whatsapp?: { foto_recibida?: boolean; creditos_bajos?: boolean };
};

type UpdateBody = {
  name?: string;
  phone?: string | null;
  notification_prefs?: NotificationPrefs;
};

/**
 * PUT /api/account
 * Actualiza campos editables del profile: name, notification_prefs.
 * El teléfono se gestiona aparte vía /api/account/phone/{send,verify}-otp
 * para forzar OTP. Email no es editable (cambiarlo requeriría re-verificar).
 *
 * Si el teléfono cambia, phone_verified_at se reinicia a NULL (el nuevo
 * número debe verificarse antes de poder recibir WhatsApp).
 */
export async function PUT(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sin sesión" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as UpdateBody | null;
  if (!body) {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  // Construimos el update solo con los campos enviados (PATCH semantics)
  const update: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const trimmed = body.name.trim();
    if (trimmed.length === 0 || trimmed.length > 80) {
      return NextResponse.json({ error: "El nombre debe tener entre 1 y 80 caracteres" }, { status: 400 });
    }
    update.name = trimmed;
  }

  // El teléfono ya NO se acepta por este endpoint. Se gestiona vía
  // /api/account/phone/send-otp + verify-otp para que cada número quede
  // verificado por OTP antes de quedar guardado. Si el cliente lo manda,
  // lo ignoramos (backward compat — no rompemos PUTs antiguos).
  if (body.phone === null) {
    // Borrar teléfono SÍ está permitido sin OTP — el user puede revocar
    // su consentimiento de WhatsApp cuando quiera.
    update.phone = null;
    update.phone_verified_at = null;
  }

  if (body.notification_prefs && typeof body.notification_prefs === "object") {
    // Sanitizamos: solo aceptamos las claves conocidas. Cualquier extra
    // se ignora (no contamina el JSON guardado).
    const np = body.notification_prefs;
    update.notification_prefs = {
      email: {
        foto_recibida: !!np.email?.foto_recibida,
        creditos_bajos: !!np.email?.creditos_bajos,
        novedades: !!np.email?.novedades,
      },
      whatsapp: {
        foto_recibida: !!np.whatsapp?.foto_recibida,
        creditos_bajos: !!np.whatsapp?.creditos_bajos,
      },
    };
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update(update)
    .eq("id", user.id);
  if (error) {
    console.error("[account PUT] update failed", error);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
