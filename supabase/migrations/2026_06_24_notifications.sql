-- Feature: notificaciones in-app (campana del header)
--
-- Sistema mínimo viable: cada notificación tiene user_id (owner), type
-- (clave del tipo de evento), payload (jsonb con datos para renderizar) y
-- read_at (NULL = no leída).
--
-- Tipos iniciales:
--   - 'collaborator_photo_received': payload { collaborator_name, project_id,
--     project_title, auto_applied: bool, photo_url? }
--
-- Más tipos a añadir cuando aparezcan eventos relevantes (créditos bajos,
-- comentarios en flyer, etc.). El frontend renderiza según `type`.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index optimizado para "dame mis notificaciones no leídas, más recientes
-- primero" — query principal del header (campana con badge contador).
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Index para la lista completa (dropdown desplegado / página de
-- notificaciones futura). Cubre tanto leídas como no leídas.
CREATE INDEX IF NOT EXISTS idx_notifications_user_all
  ON public.notifications(user_id, created_at DESC);

-- Row Level Security: cada usuario solo ve y modifica sus notificaciones.
-- INSERT lo hace el backend con service_role (sin RLS), nunca el cliente.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

COMMENT ON TABLE public.notifications IS
  'Notificaciones in-app por usuario. Renderizadas en la campana del header. INSERT solo via service_role (backend).';
COMMENT ON COLUMN public.notifications.type IS
  'Tipo de evento. Frontend usa este valor para elegir icono + plantilla de texto. Conocidos: collaborator_photo_received.';
COMMENT ON COLUMN public.notifications.payload IS
  'Datos contextuales para renderizar la notificación. Shape depende de type.';
COMMENT ON COLUMN public.notifications.read_at IS
  'Timestamp de cuándo el usuario marcó la notificación como leída. NULL = pendiente (suma al badge contador).';
