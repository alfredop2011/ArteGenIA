-- ═══════════════════════════════════════════════════════════════════
-- AUDIT — verificar que el cron de reset mensual funcionó
-- ═══════════════════════════════════════════════════════════════════
--
-- Contexto: hoy es 2 de julio 2026. El cron está programado en Vercel
-- con schedule `0 3 1 * *` — se ejecuta el DÍA 1 de cada mes a las
-- 03:00 UTC (05:00 CEST España). Ayer (1 jul) debería haber corrido.
--
-- Este script NO modifica nada — solo lee. Ejecuta en Supabase SQL
-- Editor → New query → pega → Run.
-- ═══════════════════════════════════════════════════════════════════

-- ─── 1. ¿Cuántos users fueron reseteados AYER? ────────────────────
-- Si el cron corrió, los users con reset_at anterior a hoy tendrán
-- last_reset_at = ayer (1 julio 2026).
SELECT
    COUNT(*) FILTER (WHERE last_reset_at::date = '2026-07-01')  AS reseteados_ayer,
    COUNT(*) FILTER (WHERE last_reset_at::date = '2026-06-01')  AS reseteados_ultimo_mes,
    COUNT(*) FILTER (WHERE last_reset_at IS NULL)               AS nunca_reseteados,
    COUNT(*)                                                     AS total_user_credits
FROM public.user_credits;

-- ─── 2. Muestra los 20 users más recientemente reseteados ─────────
-- Deberías ver last_reset_at en 2026-07-01 03:xx:xx UTC si el cron
-- corrió bien.
SELECT
    uc.user_id,
    p.email,
    p.plan,
    uc.balance,
    uc.monthly_grant,
    uc.last_reset_at,
    uc.reset_at AS proximo_reset,
    uc.low_credits_emailed_at
FROM public.user_credits uc
LEFT JOIN public.profiles p ON p.id = uc.user_id
ORDER BY uc.last_reset_at DESC NULLS LAST
LIMIT 20;

-- ─── 3. Consistencia: ¿monthly_grant coincide con el plan? ────────
-- Expected: free=10, pro=100, enterprise=350. Si hay filas con plan y
-- monthly_grant que no cuadran, hubo un cambio de plan que no sincronizó.
SELECT
    p.plan,
    uc.monthly_grant,
    COUNT(*) as users
FROM public.user_credits uc
LEFT JOIN public.profiles p ON p.id = uc.user_id
GROUP BY p.plan, uc.monthly_grant
ORDER BY p.plan, uc.monthly_grant;

-- ─── 4. Detección de anomalías: users con balance NEGATIVO o >1000 ─
-- Balance debería estar siempre en [0, ~500]. Fuera de rango = bug.
SELECT
    uc.user_id,
    p.email,
    p.plan,
    uc.balance,
    uc.monthly_grant,
    uc.last_reset_at
FROM public.user_credits uc
LEFT JOIN public.profiles p ON p.id = uc.user_id
WHERE uc.balance < 0 OR uc.balance > 1000;

-- ─── 5. Users cuyo reset_at ya pasó pero no se resetearon ─────────
-- Si esta query devuelve filas, el cron NO corrió correctamente.
-- Debería estar VACÍA después del día 1.
SELECT
    uc.user_id,
    p.email,
    uc.balance,
    uc.reset_at,
    uc.last_reset_at,
    now() AS ahora
FROM public.user_credits uc
LEFT JOIN public.profiles p ON p.id = uc.user_id
WHERE uc.reset_at <= now()
LIMIT 10;

-- ─── 6. Consumo del mes pasado ─────────────────────────────────────
-- Cuánto se consumió en junio (por tipo de acción)
SELECT
    module,
    COUNT(*) as ops,
    SUM(amount) as total_consumido,
    AVG(amount)::numeric(10,2) as media_por_op
FROM public.credit_transactions
WHERE created_at >= '2026-06-01' AND created_at < '2026-07-01'
  AND amount < 0  -- consumo (negativo), no refunds/grants
GROUP BY module
ORDER BY total_consumido;

-- ─── 7. Resumen ejecutivo ──────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM auth.users) as usuarios_totales,
    (SELECT COUNT(*) FROM public.profiles WHERE plan = 'pro') as usuarios_pro,
    (SELECT COUNT(*) FROM public.profiles WHERE plan = 'enterprise') as usuarios_enterprise,
    (SELECT COUNT(*) FROM public.profiles WHERE plan IS NULL OR plan = 'free') as usuarios_free,
    (SELECT SUM(balance) FROM public.user_credits) as creditos_totales_en_circulacion;
