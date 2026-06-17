-- ════════════════════════════════════════════════════════════════════════
-- ENDURECIMIENTO DE SEGURIDAD (2026-06-17)
--
-- Cierra los hallazgos críticos de la auditoría de seguridad:
--
--  #1  Créditos infinitos: las funciones SECURITY DEFINER add_credits /
--      consume_credits / reset_monthly_credits eran invocables vía PostgREST
--      RPC por cualquier usuario authenticated (GRANT EXECUTE a PUBLIC por
--      defecto) y recibían p_user_id arbitrario sin validar auth.uid().
--      → REVOKE a PUBLIC/anon/authenticated en las privilegiadas + guard
--        auth.uid() en consume_credits.
--
--  #3  Idempotencia webhook Stripe: tabla stripe_events para deduplicar
--      eventos reenviados (replay / retries).
--
--  Extra (search_path hijacking en SECURITY DEFINER): añade
--      SET search_path = public a count_ai_usage_this_month y
--      increment_shared_flyer_view.
--
-- IMPORTANTE: tras revocar add_credits/reset_monthly_credits a authenticated,
-- esas funciones SOLO se pueden llamar con service_role. El código de la app
-- ya se actualizó: los refunds usan supabaseAdmin y el cron usa service_role.
-- ════════════════════════════════════════════════════════════════════════

-- ─── #1a. consume_credits: guard auth.uid() ──────────────────────────────
-- Sigue siendo llamable por authenticated (el server la llama con el cliente
-- del usuario), pero ahora un usuario SOLO puede consumir SUS propios créditos.
-- Las llamadas con service_role (auth.uid() = NULL) siguen permitidas.
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
  -- Anti-IDOR: un usuario authenticated no puede consumir créditos de otro.
  IF auth.uid() IS NOT NULL AND p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'No autorizado: solo puedes consumir tus propios créditos';
  END IF;

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

  IF v_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'balance', v_balance,
      'required', p_amount,
      'error', 'insufficient_credits'
    );
  END IF;

  v_new_balance := v_balance - p_amount;
  UPDATE public.user_credits
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

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

-- ─── #1b. REVOKE en las funciones privilegiadas (solo service_role) ──────
-- add_credits: otorga créditos (refund/topup/grant) → operación de dinero.
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.add_credits(uuid, integer, text, jsonb) TO service_role;

-- reset_monthly_credits: resetea balances de TODOS los usuarios → solo cron.
REVOKE EXECUTE ON FUNCTION public.reset_monthly_credits() FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.reset_monthly_credits() TO service_role;

-- consume_credits: callable por authenticated (con guard) y service_role; no anon.
REVOKE EXECUTE ON FUNCTION public.consume_credits(uuid, integer, text, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.consume_credits(uuid, integer, text, jsonb) TO authenticated, service_role;

-- initialize_user_credits: trigger function, no debe llamarse por RPC.
REVOKE EXECUTE ON FUNCTION public.initialize_user_credits() FROM PUBLIC, anon, authenticated;

-- ─── Extra: search_path en SECURITY DEFINER faltantes ────────────────────
CREATE OR REPLACE FUNCTION public.count_ai_usage_this_month(p_user_id uuid, p_action text)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer
  FROM ai_usage
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at >= date_trunc('month', now())
$$;

CREATE OR REPLACE FUNCTION public.increment_shared_flyer_view(flyer_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE shared_flyers
     SET view_count = view_count + 1
   WHERE id = flyer_id;
END;
$$;

-- ─── #3. Idempotencia del webhook de Stripe ──────────────────────────────
-- Cada event.id de Stripe se registra una sola vez. El handler hace INSERT
-- y, ante unique_violation (23505), trata el evento como duplicado.
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id            text PRIMARY KEY,        -- Stripe event.id (evt_...)
  type          text NOT NULL,
  processed_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
-- Sin políticas: solo accesible vía service_role (que bypassa RLS). anon/
-- authenticated no pueden leer ni escribir.

-- ─── #2. Anti-escalada de plan en profiles ───────────────────────────────
-- La columna profiles.plan solo debe escribirla el webhook de Stripe (que usa
-- service_role). Aunque exista una policy RLS de UPDATE para que el usuario
-- edite su perfil (nombre, organizer_type...), revocamos el privilegio
-- COLUMN-LEVEL de UPDATE sobre `plan` a authenticated/anon para que NO puedan
-- auto-promoverse a 'pro'/'enterprise'. service_role conserva el acceso
-- (bypassa estos grants). Defensa que no depende de la policy RLS concreta.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan'
  ) THEN
    EXECUTE 'REVOKE UPDATE (plan) ON public.profiles FROM authenticated, anon';
  END IF;
END $$;

-- NOTA MANUAL: verificar en el dashboard que public.profiles y public.projects
-- tienen RLS habilitado con políticas auth.uid()=id / auth.uid()=user_id.
-- Estas tablas NO están versionadas en migrations (se crearon fuera del repo).
