-- Fase Z.2 — Ajustar Free a 10 créditos/mes (= 5 fotos sin fondo)
-- =====================================================
-- Decisión de producto: Free debe sentir el límite rápido para acelerar
-- conversión a Pro. 10 créditos = 5 quitar-fondo + 5 descargas = 5 fotos
-- listas para usar. Antes era 30 (15 fotos), demasiado generoso.
--
-- Esta migration es IDEMPOTENTE: funciona si la 2026_06_15_user_credits.sql
-- ya se ejecutó, y también si se ejecutan ambas juntas.
-- =====================================================

-- 1. Cambiar defaults de la tabla (afecta a usuarios FUTUROS)
ALTER TABLE public.user_credits
  ALTER COLUMN balance SET DEFAULT 10;

ALTER TABLE public.user_credits
  ALTER COLUMN monthly_grant SET DEFAULT 10;

-- 2. Bajar créditos a usuarios FREE existentes
-- Lógica:
--   - Si tenía 30 créditos sin gastar (recién creado), bajar a 10
--   - Si ya gastó, mantener su balance actual SI es <=10, sino bajar a 10
--   - Update monthly_grant siempre a 10 para que el próximo reset les dé 10
--   - PROTECCIÓN: NO tocar usuarios que tienen plan pro/enterprise
UPDATE public.user_credits uc
SET
  monthly_grant = 10,
  balance = LEAST(uc.balance, 10),
  updated_at = now()
WHERE uc.monthly_grant = 30  -- solo afecta a los que estaban en el viejo default
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uc.user_id
      AND p.plan IN ('pro', 'enterprise')
  );

-- 3. Actualizar el trigger para que nuevos usuarios reciban 10 (no 30)
CREATE OR REPLACE FUNCTION public.initialize_user_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_credits (user_id, balance, monthly_grant)
  VALUES (NEW.id, 10, 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 4. Auditar: insertar una transacción de ajuste para usuarios afectados
-- (así en credit_transactions queda registro del cambio de política,
-- útil para responder reclamaciones "yo tenía X créditos")
INSERT INTO public.credit_transactions (user_id, amount, reason, module, balance_after, meta)
SELECT
  uc.user_id,
  0,  -- no es consumo ni grant, solo un marcador
  'policy_adjustment:free_to_10',
  NULL,
  uc.balance,
  jsonb_build_object(
    'previous_grant', 30,
    'new_grant', 10,
    'reason', 'Política Z.2: 5 fotos gratis al mes'
  )
FROM public.user_credits uc
WHERE uc.monthly_grant = 10  -- usuarios que acaban de pasar a 10
  AND uc.created_at < now() - interval '5 seconds';  -- excluir los recién creados
