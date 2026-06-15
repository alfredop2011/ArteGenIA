-- Fase Z.8 — Galería "Mis creaciones" (assets reutilizables del usuario)
-- =====================================================
-- Tabla para almacenar PNGs sin fondo, stickers IA, imágenes generadas, etc.
-- que el usuario quiere reutilizar en cualquier flyer.
--
-- Tipos soportados:
--   - sin_fondo      : PNG transparente de /quitar-fondo
--   - sticker_ia     : Persona extraída con SAM-3 (Capas Mágicas)
--   - generada_ia    : Imagen generada con Flux
--   - subida         : Upload manual del usuario
--
-- Storage por plan (validado en /api/assets POST):
--   Free       : 100 MB
--   Pro        : 5 GB
--   Enterprise : 50 GB
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_assets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Tipo del asset (controla el filtro en la UI)
  type        text NOT NULL CHECK (type IN ('sin_fondo', 'sticker_ia', 'generada_ia', 'subida')),
  -- URL pública en R2 (los PNGs ya están subidos antes de crear la row)
  url         text NOT NULL,
  -- R2 key para borrar el archivo de R2 al delete
  storage_key text,
  -- Nombre legible
  name        text NOT NULL DEFAULT 'Sin nombre',
  -- Tamaño en bytes (para sumar y validar contra storage limit)
  size_bytes  integer NOT NULL DEFAULT 0,
  -- Dimensiones (si aplica)
  width       integer,
  height      integer,
  -- Origen: dónde se creó (para analítica y "abrir en editor")
  source_module text,    -- 'quitar_fondo' | 'capas_magicas' | 'generar_ia' | 'upload'
  source_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  -- Metadata libre
  meta        jsonb DEFAULT '{}'::jsonb,
  -- Último acceso (para TTL futuro en Free + sort "recientes")
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_assets IS 'Galería personal del usuario: PNGs sin fondo, stickers, etc. Fase Z.8';

CREATE INDEX IF NOT EXISTS idx_user_assets_user_type
  ON public.user_assets(user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_assets_last_used
  ON public.user_assets(user_id, last_used_at DESC);

-- RLS: cada usuario solo ve y borra sus propios assets
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_assets_select_own" ON public.user_assets;
CREATE POLICY "user_assets_select_own" ON public.user_assets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_assets_insert_own" ON public.user_assets;
CREATE POLICY "user_assets_insert_own" ON public.user_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_assets_delete_own" ON public.user_assets;
CREATE POLICY "user_assets_delete_own" ON public.user_assets
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_assets_update_own" ON public.user_assets;
CREATE POLICY "user_assets_update_own" ON public.user_assets
  FOR UPDATE USING (auth.uid() = user_id);

-- Función helper: storage total usado por usuario
CREATE OR REPLACE FUNCTION public.get_user_storage_bytes(p_user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(size_bytes)::bigint, 0)
  FROM public.user_assets
  WHERE user_id = p_user_id;
$$;
