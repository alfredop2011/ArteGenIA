-- Agenda cultural pública — tabla de eventos
-- =====================================================
-- Soporta la landing /eventos (consulta pública) y el panel /organizador
-- (CRUD del organizador autenticado).
--
-- Modelo:
--   - status = 'published'  → visible para CUALQUIERA en la agenda pública.
--   - status = 'draft'      → solo lo ve y edita su organizador.
--
-- RLS:
--   - Lectura pública de los publicados (sin login).
--   - El organizador ve/crea/edita/borra SOLO sus propios eventos.
-- =====================================================

-- Reejecutable: si existía una versión vieja/parcial de la tabla (p. ej. de
-- un intento anterior sin todas las columnas), la recreamos limpia. La tabla
-- aún no tiene datos reales, así que es seguro. CASCADE arrastra trigger/policies.
DROP TABLE IF EXISTS public.events CASCADE;

CREATE TABLE IF NOT EXISTS public.events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULLABLE: un evento puede entrar por bot SIN cuenta de usuario. Se queda
  -- "huérfano" hasta que su autor abre cuenta y lo reclama (organizer_id se
  -- rellena entonces). Los eventos del panel web sí traen organizer_id.
  organizer_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Identidad del remitente cuando llega por bot (para agrupar y reclamar).
  submitter_channel text,                          -- 'telegram' | 'whatsapp' | 'web'
  submitter_ref     text,                          -- chat id / teléfono del remitente
  claim_token       uuid,                          -- token para reclamar todos sus eventos al abrir cuenta
  title         text NOT NULL,
  description   text,
  -- Cuándo
  event_date    date NOT NULL,
  event_time    text NOT NULL DEFAULT '20:00',   -- HH:mm (string para evitar líos de timezone)
  -- Dónde
  country       text NOT NULL DEFAULT 'es',       -- id país (es, mx, ar, co…)
  city          text NOT NULL,                    -- id ciudad (madrid, barcelona…)
  venue         text NOT NULL,
  neighborhood  text,
  -- Qué — categorías alineadas con la taxonomía del producto (multi-circuito).
  category      text NOT NULL CHECK (category IN ('fiesta','conciertos','festival','clases','club','corporativo')),
  -- Para quién es (audiencias). Array: un evento puede apuntar a varias.
  -- Valores: academias, productoras, freelance, instituciones, agencias, colegios.
  audience      text[] NOT NULL DEFAULT '{}',
  price         numeric(10,2) NOT NULL DEFAULT 0, -- 0 = gratis
  has_online_sale boolean NOT NULL DEFAULT false,  -- ¿tiene venta de entradas online?
  ticket_url    text,                             -- página del evento / pago (si has_online_sale)
  image_url     text,                             -- flyer del evento (R2). NULL → gradiente por categoría
  image_key     text,                             -- key en R2 (para borrar el flyer al eliminar)
  -- Origen del evento: panel web, bots de mensajería, o el agente automático.
  source        text NOT NULL DEFAULT 'organizer' CHECK (source IN ('organizer','telegram','whatsapp','auto')),
  -- Estado: draft (solo dueño) | published (público) | cancelled (público con
  -- sello CANCELADO para que la comunidad sepa que no se celebra).
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.events IS 'Eventos de la agenda cultural pública /eventos. 2026-06-18';

-- Índice para la consulta pública (publicados, por país/ciudad, ordenados por fecha)
CREATE INDEX IF NOT EXISTS idx_events_public
  ON public.events(status, country, city, event_date);

-- Índice para el panel del organizador
CREATE INDEX IF NOT EXISTS idx_events_organizer
  ON public.events(organizer_id, created_at DESC);

-- Índice para reclamar eventos enviados por bot (sin cuenta todavía).
CREATE INDEX IF NOT EXISTS idx_events_claim
  ON public.events(claim_token) WHERE organizer_id IS NULL;

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Lectura: publicados Y cancelados visibles para todos (el cancelado se
-- muestra con sello); los borradores solo su dueño.
DROP POLICY IF EXISTS "events_select_published_or_own" ON public.events;
CREATE POLICY "events_select_published_or_own" ON public.events
  FOR SELECT
  USING (status IN ('published','cancelled') OR auth.uid() = organizer_id);

-- Inserción: solo autenticado y como dueño.
DROP POLICY IF EXISTS "events_insert_own" ON public.events;
CREATE POLICY "events_insert_own" ON public.events
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

-- Actualización: solo el dueño.
DROP POLICY IF EXISTS "events_update_own" ON public.events;
CREATE POLICY "events_update_own" ON public.events
  FOR UPDATE
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Borrado: solo el dueño.
DROP POLICY IF EXISTS "events_delete_own" ON public.events;
CREATE POLICY "events_delete_own" ON public.events
  FOR DELETE
  USING (auth.uid() = organizer_id);

-- Mantener updated_at al día en cada UPDATE.
CREATE OR REPLACE FUNCTION public.events_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.events_set_updated_at();

-- Reclamar eventos: cuando el autor que envió flyers por bot (sin cuenta)
-- abre una cuenta, asigna todos sus eventos huérfanos a su user id.
-- SECURITY DEFINER para poder tocar filas con organizer_id NULL (que RLS
-- normalmente esconde). Devuelve cuántos eventos se reclamaron.
CREATE OR REPLACE FUNCTION public.claim_events_by_token(p_token uuid, p_user uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.events
     SET organizer_id = p_user,
         claim_token  = NULL
   WHERE claim_token = p_token
     AND organizer_id IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;
