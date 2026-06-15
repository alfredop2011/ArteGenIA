-- Fase Z.4 — Recalibrar Pro/Enterprise para precio = 4× coste real
-- =====================================================
-- Decisión user: "Definir cuánto cuesta 1 crédito costando el doble.
-- 1 para mantenimiento + 2 para ganancias" = precio crédito = 4× coste IA.
--
-- Matemática (1 crédito = $0.025 USD coste interno):
--   Precio efectivo = 4 × $0.025 = $0.10 USD/crédito
--
--   Pro 9,99€   → $10.46 neto / $0.10 = 105 → 100 créditos
--                 Margen peor caso: 75%. Promedio: 85%.
--   Enterprise 34,99€ → $36.65 neto / $0.10 = 366 → 350 créditos
--   Free → 10 sin cambio
--
-- Migration IDEMPOTENTE: si ya se aplicó, no rompe nada.
-- =====================================================

-- 1. Ajustar usuarios Pro existentes
UPDATE public.user_credits uc
SET
  monthly_grant = 100,
  balance = LEAST(uc.balance, 100),
  updated_at = now()
FROM public.profiles p
WHERE p.id = uc.user_id
  AND p.plan = 'pro'
  AND uc.monthly_grant != 100;

-- 2. Ajustar usuarios Enterprise
UPDATE public.user_credits uc
SET
  monthly_grant = 350,
  balance = LEAST(uc.balance, 350),
  updated_at = now()
FROM public.profiles p
WHERE p.id = uc.user_id
  AND p.plan = 'enterprise'
  AND uc.monthly_grant != 350;

-- 3. Auditar el cambio de política
INSERT INTO public.credit_transactions (user_id, amount, reason, module, balance_after, meta)
SELECT
  uc.user_id,
  0,
  'policy_adjustment:cost_4x',
  NULL,
  uc.balance,
  jsonb_build_object(
    'new_grant', uc.monthly_grant,
    'reason', 'Política Z.4: precio crédito = 4× coste real (1 IA + 1 mant + 2 ganancia)'
  )
FROM public.user_credits uc
INNER JOIN public.profiles p ON p.id = uc.user_id
WHERE (p.plan = 'pro' AND uc.monthly_grant = 100)
   OR (p.plan = 'enterprise' AND uc.monthly_grant = 350);
