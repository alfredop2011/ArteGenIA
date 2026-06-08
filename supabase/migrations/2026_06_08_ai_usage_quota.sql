-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: ai_usage + plan en profiles
--
-- Cuotas de uso de AI (Fal.ai SAM-2 segmentacion, generate-bg, etc).
-- Cada llamada AI registrada permite contar uso mensual por usuario y
-- bloquearlo si excede la cuota del plan.
--
-- Limites por plan:
--   - free:  10 segmentaciones / mes (~$0.03/usuario/mes coste tope)
--   - pro:   ilimitado
--
-- Ejecutar en el SQL Editor de Supabase Dashboard.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Anadir columna 'plan' a profiles (si no existe) ───────────────────
alter table profiles
  add column if not exists plan text not null default 'free'
  check (plan in ('free', 'pro'));

-- Index simple para queries de "is_pro"
create index if not exists idx_profiles_plan on profiles (plan);

-- ─── 2. Tabla ai_usage ───────────────────────────────────────────────────
-- Cada fila = una llamada AI exitosa. Permite contar uso por mes.
create table if not exists ai_usage (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- Tipo de accion AI: 'segment_person', 'generate_bg', 'remove_bg', etc.
  -- Permite cuotas distintas por tipo si en el futuro hace falta.
  action          text not null,
  -- Coste estimado en USD (por si queremos calcular gasto real)
  cost_usd        numeric(10,4) not null default 0,
  -- Metadata opcional: { model, prompt_count, image_size, ... }
  meta            jsonb,
  created_at      timestamp with time zone not null default now()
);

-- Indices para queries comunes
create index if not exists idx_ai_usage_user_month
  on ai_usage (user_id, action, created_at desc);

-- ─── 3. RLS (Row Level Security) ──────────────────────────────────────────
alter table ai_usage enable row level security;

-- Cada usuario puede LEER su propio uso (para mostrar "x/10 este mes")
drop policy if exists ai_usage_select_own on ai_usage;
create policy ai_usage_select_own on ai_usage
  for select using (auth.uid() = user_id);

-- INSERT solo desde service_role (el endpoint server-side usa SERVICE_ROLE_KEY).
-- Esto evita que el cliente inserte filas falsas para resetear cuotas.
-- (No definimos policy de INSERT publica.)

-- ─── 4. Funcion helper: count_ai_usage_this_month ────────────────────────
-- Devuelve cuantas veces el usuario uso una accion en el mes natural actual.
-- Util desde el endpoint backend para chequear cuota antes de llamar a Fal.
create or replace function count_ai_usage_this_month(p_user_id uuid, p_action text)
returns integer
language sql
stable
security definer
as $$
  select count(*)::integer
  from ai_usage
  where user_id = p_user_id
    and action = p_action
    and created_at >= date_trunc('month', now())
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- LISTO. Si todo OK, ai_usage existe vacia y profiles.plan = 'free' para todos.
-- Para promover usuario a Pro manualmente:
--   update profiles set plan = 'pro' where id = '<uuid-del-user>';
-- ════════════════════════════════════════════════════════════════════════════
