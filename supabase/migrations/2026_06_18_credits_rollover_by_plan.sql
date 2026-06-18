-- Fix: rollover por plan + corrección de DEFAULT base
--
-- Contexto: la 2ª reunión del panel (acta 2026-06-18) detectó 2 bugs SQL:
--
-- BUG 1 — `user_credits.sql` (migración base) define DEFAULT 30 para
--   balance y monthly_grant. La migración `credits_free_to_10.sql` los
--   cambió a 10, pero solo afecta a las filas existentes. El DEFAULT en
--   la columna sigue siendo 30, así que cualquier rebuild limpio
--   (Supabase reordena alfabéticamente) podría revertir nuevos signups
--   a 30 créditos. Bomba de relojería.
--
-- BUG 2 — `reset_monthly_credits()` hace `LEAST(uc.balance, 50)` hardcoded
--   sin distinguir por plan. Esto contradice la constante `ROLLOVER_CAP`
--   de `lib/credits.ts` que es la SSOT del producto:
--     - free       = 0 (sin rollover: use it or lose it)
--     - pro        = 50
--     - enterprise = 50
--   Comportamiento actual: el plan Free acumula hasta 50 créditos,
--   regalándole valor extra y contradiciendo la página de términos.
--   Decisión del founder: Free debe recibir 10 créditos cada mes (sin
--   rollover) para que pruebe el producto fresh cada mes → genera
--   confianza repetida en lugar de acumulación.

-- 1) Corregir DEFAULT base a 10 (in-place, sin renombrar archivo)
ALTER TABLE public.user_credits
  ALTER COLUMN balance SET DEFAULT 10;

ALTER TABLE public.user_credits
  ALTER COLUMN monthly_grant SET DEFAULT 10;

-- 2) Reescribir reset_monthly_credits con CASE por plan.
--    Mantiene la nulidad de low_credits_emailed_at (Z.23) y todos los
--    timestamps tal cual estaban.
--
--    JOIN con `profiles` para acceder al plan. Si un user existe en
--    user_credits pero no en profiles (raro, integridad rota), CASE ELSE
--    lo trata como Free por seguridad.
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer := 0;
BEGIN
  WITH updated AS (
    UPDATE public.user_credits uc
    SET balance = (
          CASE
            WHEN p.plan = 'free'       THEN 0
            WHEN p.plan = 'pro'        THEN LEAST(uc.balance, 50)
            WHEN p.plan = 'enterprise' THEN LEAST(uc.balance, 50)
            ELSE 0
          END
        ) + uc.monthly_grant,
        reset_at = date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month',
        last_reset_at = now(),
        low_credits_emailed_at = NULL,
        updated_at = now()
    FROM public.profiles p
    WHERE uc.user_id = p.id
      AND uc.reset_at <= now()
    RETURNING uc.user_id, uc.balance
  )
  SELECT count(*) INTO v_count FROM updated;
  RETURN jsonb_build_object('reset_users', v_count, 'reset_at', now());
END;
$$;

COMMENT ON FUNCTION public.reset_monthly_credits IS
  'Reset mensual con rollover por plan: free=0 (sin acumular), pro=50, enterprise=50. Alineado con ROLLOVER_CAP de lib/credits.ts.';
