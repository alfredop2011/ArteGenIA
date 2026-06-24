-- Phone OTP verifications — para verificar el teléfono antes de activar
-- notificaciones por WhatsApp.
--
-- Flow:
--   1. User mete teléfono en /cuenta → POST /api/account/phone/send-otp
--   2. Backend genera código 6 dígitos, lo guarda con expiración 10 min,
--      manda template phone_otp_v1 por WhatsApp Cloud API
--   3. User mete código → POST /api/account/phone/verify-otp
--   4. Si coincide y no expiró: marca profiles.phone_verified_at, borra fila
--
-- Anti-abuso:
--   - 1 OTP cada 60s por user (cooldown)
--   - 3 intentos máximo por código antes de invalidar
--   - 10 OTPs por día por user
--
-- La fila se borra al verificar OK o al expirar (cron diario).

CREATE TABLE IF NOT EXISTS public.phone_verifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone       TEXT NOT NULL,                          -- E.164 format: +34666123456
    code        TEXT NOT NULL,                          -- 6 dígitos
    attempts    INT  NOT NULL DEFAULT 0,                -- intentos fallidos
    sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL,                   -- sent_at + 10 min
    verified_at TIMESTAMPTZ                             -- NULL hasta que el user mete OK
);

-- Solo un OTP activo por user a la vez (si reenvía, sobrescribe el anterior)
CREATE UNIQUE INDEX IF NOT EXISTS idx_phone_verifications_user_active
    ON public.phone_verifications (user_id)
    WHERE verified_at IS NULL AND expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires
    ON public.phone_verifications (expires_at);

-- RLS: solo el propio user puede ver sus OTPs (ni siquiera el frontend
-- los necesita realmente, solo el backend con service_role los lee, pero
-- mejor estar seguro).
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS phone_verifications_self_select ON public.phone_verifications;
CREATE POLICY phone_verifications_self_select
    ON public.phone_verifications
    FOR SELECT
    USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE solo el service_role (no permitimos al frontend
-- crear OTPs directamente — siempre via endpoint que rate-limita).

COMMENT ON TABLE  public.phone_verifications IS 'OTPs de 6 dígitos para verificar teléfono antes de activar WhatsApp';
COMMENT ON COLUMN public.phone_verifications.code IS 'Código numérico de 6 dígitos. No hasheamos porque la ventana es muy corta (10 min) y solo el service_role lo lee.';
