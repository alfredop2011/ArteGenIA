-- Z.23 — flag para evitar spam de emails low credits.
-- El cron diario /api/cron/low-credits manda email cuando balance < 20% grant
-- pero solo si NO se envió ya este mes (después del último reset).

ALTER TABLE public.user_credits
ADD COLUMN IF NOT EXISTS low_credits_emailed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_credits_low_email
  ON public.user_credits(low_credits_emailed_at)
  WHERE low_credits_emailed_at IS NOT NULL;

-- También limpiar el flag cuando se hace reset mensual.
-- Actualizamos la función reset_monthly_credits para que setee NULL.
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_count integer := 0;
BEGIN
  WITH updated AS (
    UPDATE public.user_credits uc
    SET balance = LEAST(uc.balance, 50) + uc.monthly_grant,
        reset_at = date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month',
        last_reset_at = now(),
        low_credits_emailed_at = NULL,  -- Z.23: limpiar flag de email
        updated_at = now()
    WHERE uc.reset_at <= now()
    RETURNING uc.user_id, uc.balance
  )
  SELECT count(*) INTO v_count FROM updated;
  RETURN jsonb_build_object('reset_users', v_count, 'reset_at', now());
END;
$$;
