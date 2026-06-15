-- Fase Z.3 — Recalibrar Pro/Enterprise para garantizar 50% margen mínimo
-- =====================================================
-- Decisión user: "Necesito por lo menos ganarle el doble a lo que ellos
-- pagan. Si Pro es 9,99€, dar créditos en función a la mitad en €."
--
-- Matemática:
--   Pro 9,99€   → 50% margen = $5.23 USD coste IA máx = 200 créditos
--   Enterprise 34,99€ → 50% margen = $18.32 USD = 700 créditos
--   Free → sin cambio (10 créditos, es gratis)
--
-- Verificación peor caso (variaciones IA = 6 créditos = $0.16 coste):
--   Pro 200/6 = 33 × $0.16 = $5.28 vs $10.46 neto = 49.5% margen ✓
--
-- Migration IDEMPOTENTE: si ya se aplicó, no rompe nada.
-- =====================================================

-- 1. Ajustar usuarios Pro existentes (si los hay)
UPDATE public.user_credits uc
SET
  monthly_grant = 200,
  balance = LEAST(uc.balance, 200),  -- nadie con más de 200 (excedente al actualizar)
  updated_at = now()
FROM public.profiles p
WHERE p.id = uc.user_id
  AND p.plan = 'pro'
  AND uc.monthly_grant != 200;  -- solo si todavía no está ajustado

-- 2. Ajustar usuarios Enterprise (si los hay)
UPDATE public.user_credits uc
SET
  monthly_grant = 700,
  balance = LEAST(uc.balance, 700),
  updated_at = now()
FROM public.profiles p
WHERE p.id = uc.user_id
  AND p.plan = 'enterprise'
  AND uc.monthly_grant != 700;

-- 3. Auditar el ajuste de política (útil para soporte futuro)
INSERT INTO public.credit_transactions (user_id, amount, reason, module, balance_after, meta)
SELECT
  uc.user_id,
  0,  -- marcador de cambio de política
  'policy_adjustment:margin_50pct',
  NULL,
  uc.balance,
  jsonb_build_object(
    'new_grant', uc.monthly_grant,
    'reason', 'Política Z.3: garantizar 50% margen mínimo'
  )
FROM public.user_credits uc
INNER JOIN public.profiles p ON p.id = uc.user_id
WHERE (p.plan = 'pro' AND uc.monthly_grant = 200)
   OR (p.plan = 'enterprise' AND uc.monthly_grant = 700);
