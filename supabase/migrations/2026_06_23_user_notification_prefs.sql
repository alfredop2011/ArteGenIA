-- Feature: configuración de cuenta + preferencias de notificación
--
-- Añade a profiles los campos necesarios para que el usuario:
--   1. Tenga un teléfono asociado (futuro WhatsApp + recuperación de cuenta)
--   2. Elija por qué canales quiere recibir cada tipo de notificación
--
-- Por defecto:
--   - email.foto_recibida = true   (se mantiene el comportamiento actual)
--   - email.creditos_bajos = true  (ya activo via cron LowCredits email)
--   - email.novedades = false      (opt-in marketing)
--   - whatsapp.*       = false     (se activan cuando configuren teléfono
--                                  + tengamos integración WhatsApp viva)
--
-- El backend lee notification_prefs antes de enviar cualquier notificación.
-- Si la columna no existe aún o devuelve null, el código asume defaults
-- (compatibilidad hacia atrás para usuarios pre-migration).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb
  DEFAULT '{
    "email": {
      "foto_recibida": true,
      "creditos_bajos": true,
      "novedades": false
    },
    "whatsapp": {
      "foto_recibida": false,
      "creditos_bajos": false
    }
  }'::jsonb;

-- Backfill: usuarios existentes obtienen los defaults (no se quedan en NULL).
UPDATE public.profiles
SET notification_prefs = '{
  "email": {
    "foto_recibida": true,
    "creditos_bajos": true,
    "novedades": false
  },
  "whatsapp": {
    "foto_recibida": false,
    "creditos_bajos": false
  }
}'::jsonb
WHERE notification_prefs IS NULL;

COMMENT ON COLUMN public.profiles.phone IS
  'Teléfono E.164 (ej. +34611111111). Usado para WhatsApp y futuro 2FA. NULL = no configurado.';
COMMENT ON COLUMN public.profiles.phone_verified_at IS
  'Timestamp de verificación del teléfono. NULL = no verificado. WhatsApp NO se envía a teléfonos sin verificar (anti-spam).';
COMMENT ON COLUMN public.profiles.notification_prefs IS
  'Preferencias de notificación por canal y evento. JSON con shape: { email: { foto_recibida: bool, creditos_bajos: bool, novedades: bool }, whatsapp: { foto_recibida: bool, creditos_bajos: bool } }.';
