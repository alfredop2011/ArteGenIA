-- Fase P0.2 — Persistir stripe_customer_id en profiles
-- =====================================================
-- Acta de reunión 2026-06-17: el webhook subscription.deleted/updated
-- resuelve el usuario SOLO por sub.metadata.supabase_user_id. Si esa
-- metadata falta (sub creada desde Dashboard, importada, legacy o
-- corrupta) → break silencioso, el plan NO baja a "free" y el user
-- conserva créditos Pro tras cancelar.
--
-- Solución: guardar el customer_id de Stripe en profiles al
-- checkout.session.completed. Webhook puede entonces fallback a:
--   1. metadata.supabase_user_id     (preferido)
--   2. profiles.stripe_customer_id   (fiable, sin email duplicate)
--   3. customer.email → profiles.email  (último recurso)
--
-- Idempotente: si la columna ya existe no falla.
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Índice para lookups O(1) desde el webhook (fallback #2).
-- No UNIQUE: un mismo customer_id NUNCA debería estar en 2 perfiles,
-- pero si Stripe Connect o un import legacy lo provocara, preferimos
-- no romper el webhook entero — solo loguear y seguir.
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN public.profiles.stripe_customer_id IS
  'ID de Stripe Customer (cus_...). Se persiste en checkout.session.completed. Usado por webhook + portal para resolver user sin depender de metadata.';
