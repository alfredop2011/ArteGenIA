-- Extras de la agenda (aditivo, NO borra datos):
--   1. submitter_name: nombre del remitente del bot (para saludarle / mostrarlo).
--   2. price nullable: distinguir "sin precio" (NULL → "Consultar precio")
--      de "gratis" (0). Antes price era NOT NULL DEFAULT 0 y todo flyer sin
--      precio salía como gratis, lo cual es incorrecto.
--   3. Política RLS de admin: los emails admin pueden ver/editar/borrar
--      CUALQUIER evento (incluidos los del bot sin dueño) desde el panel.
-- =====================================================

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS submitter_name text;

-- Permitir precio desconocido (NULL).
ALTER TABLE public.events ALTER COLUMN price DROP NOT NULL;
ALTER TABLE public.events ALTER COLUMN price DROP DEFAULT;

-- Admin: acceso total (lectura + escritura) por email del JWT.
-- Mantener sincronizado con lib/admin.ts (ADMIN_EMAILS).
DROP POLICY IF EXISTS "events_admin_all" ON public.events;
CREATE POLICY "events_admin_all" ON public.events
  FOR ALL
  USING ((auth.jwt() ->> 'email') IN ('alfredop2011@gmail.com', 'hola@artegenia.com'))
  WITH CHECK ((auth.jwt() ->> 'email') IN ('alfredop2011@gmail.com', 'hola@artegenia.com'));
