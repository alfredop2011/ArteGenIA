import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con permisos de ADMIN (service_role).
 *
 * ÚSALO SOLO EN ROUTE HANDLERS DE SERVIDOR. Nunca lo expongas al cliente:
 * tiene permisos para saltarse todas las políticas RLS.
 *
 * Casos de uso típicos:
 *  - Insertar datos en tablas restringidas en nombre de un usuario anónimo
 *    (ej. formulario público que crea un registro).
 *  - Validar tokens de invitación públicos (la fila del invite la tiene RLS
 *    pero quien la consulta no está autenticado todavía).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.warn(
    "[supabaseAdmin] Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
