-- Fase Z.1 — Sistema de créditos unificado
-- =====================================================
-- Reemplaza el modelo de cuotas individuales por acción
-- (segment_person 10/mes, photo_to_template 5/mes...) por
-- un balance único de créditos. Cada acción IA o descarga
-- consume N créditos según tabla en lib/credits.ts.
--
-- Política de plan (configurable en código):
--   Free       =  30 créditos/mes
--   Pro        = 250 créditos/mes (rollover hasta 50)
--   Enterprise = 2000 créditos/mes (fair use)
--
-- Reset: día 1 de cada mes UTC vía cron /api/cron/reset-credits.
-- =====================================================

-- ───────────────────────────────────────────────────────
-- Tabla principal: balance actual de créditos por usuario
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance      integer NOT NULL DEFAULT 30 CHECK (balance >= 0),
  monthly_grant integer NOT NULL DEFAULT 30,
  -- Próxima fecha de reset (1 del mes siguiente UTC). El cron compara con now().
  reset_at     timestamptz NOT NULL DEFAULT date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month',
  -- Última vez que se ejecutó el reset (para idempotencia del cron).
  last_reset_at timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_credits IS 'Balance de créditos por usuario. Reset mensual día 1 UTC. Fase Z.1';

-- ───────────────────────────────────────────────────────
-- Historial: cada movimiento de crédito (auditable)
-- ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Negativo = consume. Positivo = grant/refund/topup.
  amount      integer NOT NULL,
  -- Razón estructurada: 'consume:quitar_fondo' | 'consume:download_png'
  --                    | 'reset:monthly' | 'topup' | 'refund:download_failed'
  reason      text NOT NULL,
  -- Módulo consumido (si aplica): 'quitar_fondo', 'capas_magicas', 'download_png', etc.
  module      text,
  -- Balance resultante tras esta transacción (para fácil reconstrucción).
  balance_after integer NOT NULL,
  -- Metadata libre para debug (project_id, file_size, etc.)
  meta        jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.credit_transactions IS 'Historial de movimientos de créditos. Auditoría + analítica. Fase Z.1';

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_date
  ON public.credit_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_tx_module
  ON public.credit_transactions(module)
  WHERE module IS NOT NULL;

-- ───────────────────────────────────────────────────────
-- RLS: cada usuario solo ve sus propios créditos
-- ───────────────────────────────────────────────────────
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_credits_select_own" ON public.user_credits;
CREATE POLICY "user_credits_select_own" ON public.user_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "credit_tx_select_own" ON public.credit_transactions;
CREATE POLICY "credit_tx_select_own" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ───────────────────────────────────────────────────────
-- FUNCIÓN ATÓMICA: consumir créditos
-- ───────────────────────────────────────────────────────
-- Llamada desde el server con SECURITY DEFINER (bypassa RLS).
-- Garantiza atomicidad (lock + check + update + insert tx en una sola tx SQL).
-- Si no hay créditos suficientes, devuelve success=false (no falla).
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id uuid,
  p_amount  integer,
  p_module  text,
  p_meta    jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance integer;
  v_new_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount debe ser positivo';
  END IF;

  -- Asegurar que existe la row del usuario (idempotente)
  INSERT INTO public.user_credits (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock pesimista + leer balance
  SELECT balance INTO v_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Insufficient: devolvemos success=false (el caller decide qué hacer)
  IF v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'balance', v_balance,
      'required', p_amount,
      'error', 'insufficient_credits'
    );
  END IF;

  -- Consumir
  v_new_balance := v_balance - p_amount;
  UPDATE public.user_credits
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  -- Auditar
  INSERT INTO public.credit_transactions (user_id, amount, reason, module, balance_after, meta)
  VALUES (
    p_user_id,
    -p_amount,
    'consume:' || p_module,
    p_module,
    v_new_balance,
    p_meta
  );

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_new_balance,
    'consumed', p_amount
  );
END;
$$;

-- ───────────────────────────────────────────────────────
-- FUNCIÓN: añadir créditos (refund, topup, grant)
-- ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.add_credits(
  p_user_id uuid,
  p_amount  integer,
  p_reason  text,
  p_meta    jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'amount debe ser positivo';
  END IF;

  INSERT INTO public.user_credits (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = user_credits.balance + EXCLUDED.balance,
        updated_at = now()
  RETURNING balance INTO v_new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, reason, module, balance_after, meta)
  VALUES (p_user_id, p_amount, p_reason, NULL, v_new_balance, p_meta);

  RETURN jsonb_build_object('success', true, 'balance', v_new_balance);
END;
$$;

-- ───────────────────────────────────────────────────────
-- FUNCIÓN: reset mensual (idempotente, llamada por cron)
-- ───────────────────────────────────────────────────────
-- Para cada usuario cuyo reset_at <= now(), reinicia su balance al
-- monthly_grant (con rollover Pro cap 50). Reentrante: si se llama
-- 2 veces en el mismo día, la 2ª no hace nada (last_reset_at check).
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  WITH updated AS (
    UPDATE public.user_credits uc
    SET
      -- Rollover: hasta 50 créditos sin usar del mes anterior se mantienen
      balance = LEAST(uc.balance, 50) + uc.monthly_grant,
      reset_at = date_trunc('month', now() AT TIME ZONE 'UTC') + interval '1 month',
      last_reset_at = now(),
      updated_at = now()
    WHERE uc.reset_at <= now()
    RETURNING uc.user_id, uc.balance
  )
  SELECT count(*) INTO v_count FROM updated;

  -- Auditar los resets como una sola transacción agregada (no insertamos
  -- una row por usuario en credit_transactions para evitar inflar la tabla)
  RETURN jsonb_build_object('reset_users', v_count, 'reset_at', now());
END;
$$;

-- ───────────────────────────────────────────────────────
-- TRIGGER: al crear usuario, asignar créditos iniciales
-- ───────────────────────────────────────────────────────
-- Esto pasa cuando un usuario nuevo se registra. Se le asigna 30
-- créditos (Free) automáticamente. Si después compra Pro, el webhook
-- de Stripe llamará add_credits + update monthly_grant.
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, monthly_grant)
  VALUES (NEW.id, 30, 30)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_init_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_init_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_credits();

-- ───────────────────────────────────────────────────────
-- BACKFILL: crear rows para usuarios existentes
-- ───────────────────────────────────────────────────────
-- Ejecutar UNA VEZ. Asigna 30 créditos a todos los usuarios que ya tenían
-- cuenta antes de esta migration. Si ya pagaron Pro, ajustar manualmente
-- después con: UPDATE user_credits SET balance=250, monthly_grant=250 WHERE user_id=...
INSERT INTO public.user_credits (user_id, balance, monthly_grant)
SELECT id, 30, 30 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
