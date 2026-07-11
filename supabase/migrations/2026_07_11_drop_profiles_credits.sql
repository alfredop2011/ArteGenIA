-- Fase Z.x — Eliminar columna legacy profiles.credits
-- =====================================================
-- `profiles.credits` (integer) sobró del sistema de créditos ANTIGUO,
-- previo a la migración al sistema unificado (Fase Z.1). El sistema real
-- vive en `user_credits.balance` / `user_credits.monthly_grant` (ver
-- 2026_06_15_user_credits.sql), y desde Z.1 NINGÚN código de lógica
-- lee ni escribe `profiles.credits`.
--
-- Como la columna nunca se actualiza, quedó congelada en valores viejos
-- (p.ej. admin con profiles.credits=20 mientras user_credits.balance=100),
-- lo que confunde al inspeccionar la BD. La eliminamos para limpiar.
--
-- NO afecta al sistema vivo: user_credits y credit_transactions quedan
-- intactos. Solo se retira la columna muerta de profiles.
--
-- Idempotente: si la columna ya no existe no falla.
-- Backup previo: pg_dump reciente en ~/artegenia-backups/.
-- =====================================================

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS credits;
