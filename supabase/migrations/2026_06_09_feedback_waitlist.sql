-- Migration: feedback + waitlist para validar el MVP
--
-- Ejecutar manualmente en Supabase Dashboard → SQL Editor.
--
-- Objetivo: recoger señales de validación ANTES de invertir tiempo
-- en pagos reales:
--  - `feedback` → qué piensan los usuarios del producto
--  - `waitlist` → quién quiere pagar cuando llegue Pro
--
-- Ambas tablas son insert-only desde el cliente (RLS). Solo el admin lee.

-- ────────────────────────────────────────────────────────────────────
-- 1) FEEDBACK
-- ────────────────────────────────────────────────────────────────────

create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  email       text,                  -- email opcional si user anonimo
  message     text not null,
  page        text,                  -- ruta donde estaba al mandar
  user_agent  text,                  -- browser/device para reproducir
  resolved    boolean default false, -- admin marca cuando atendio
  created_at  timestamptz default now()
);

create index if not exists feedback_created_at_idx on public.feedback(created_at desc);
create index if not exists feedback_resolved_idx on public.feedback(resolved) where resolved = false;

alter table public.feedback enable row level security;

-- Cualquiera (logueado o no) puede insertar feedback
drop policy if exists "anyone can insert feedback" on public.feedback;
create policy "anyone can insert feedback"
  on public.feedback for insert
  with check (true);

-- Solo el admin puede leer (via service_role bypass — RLS no permite SELECT
-- a usuarios normales)
-- No policy de SELECT → nadie puede leer excepto service_role

comment on table public.feedback is
  'Feedback enviado desde el widget flotante. Insert-only via RLS.';

-- ────────────────────────────────────────────────────────────────────
-- 2) WAITLIST (gente que quiere Pro cuando se libere)
-- ────────────────────────────────────────────────────────────────────

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  user_id     uuid references auth.users(id) on delete set null,
  plan        text not null,         -- 'pro' o 'business'
  cycle       text,                  -- 'monthly' o 'annual' (si nos lo dicen)
  notes       text,                  -- comentario opcional del user
  notified_at timestamptz,           -- cuando le mandamos el email de "ya esta"
  converted   boolean default false, -- si finalmente compro
  created_at  timestamptz default now()
);

-- email unico por persona/plan (evita spam de la misma cuenta)
create unique index if not exists waitlist_email_plan_idx
  on public.waitlist(email, plan);

create index if not exists waitlist_plan_idx on public.waitlist(plan);
create index if not exists waitlist_created_at_idx on public.waitlist(created_at desc);

alter table public.waitlist enable row level security;

-- Cualquiera puede apuntarse
drop policy if exists "anyone can join waitlist" on public.waitlist;
create policy "anyone can join waitlist"
  on public.waitlist for insert
  with check (true);

-- Los usuarios LOGUEADOS pueden ver su propia entrada (para mostrar
-- "ya estas en la lista" en la UI)
drop policy if exists "users see own waitlist" on public.waitlist;
create policy "users see own waitlist"
  on public.waitlist for select
  using (auth.uid() = user_id);

comment on table public.waitlist is
  'Lista de espera para planes pagos. Sirve para validar interes ANTES de implementar checkout real.';

-- ────────────────────────────────────────────────────────────────────
-- 3) VIEW para el admin dashboard (resumen rapido)
-- ────────────────────────────────────────────────────────────────────

create or replace view public.waitlist_summary as
select
  plan,
  count(*) as total,
  count(*) filter (where converted) as converted,
  count(*) filter (where created_at > now() - interval '7 days') as last_7d,
  count(*) filter (where created_at > now() - interval '30 days') as last_30d
from public.waitlist
group by plan;

grant select on public.waitlist_summary to authenticated;

comment on view public.waitlist_summary is
  'Resumen agregado de waitlist para mostrar en /admin.';
