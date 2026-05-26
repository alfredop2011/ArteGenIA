-- ════════════════════════════════════════════════════════════════════════════
-- MIGRATION: templates_draft + templates_published
--
-- Plan híbrido (decision C+C):
--   - data/templates.ts sigue siendo la "fuente oficial" del catálogo
--   - templates_draft: borradores que admin guarda mientras edita
--   - templates_published: plantillas que admin publica, leídas por /templates
--     mezcladas con las de data/templates.ts
--
-- Ejecutar en el SQL Editor de Supabase Dashboard.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── 1. Tabla de borradores (drafts) ────────────────────────────────────
create table if not exists templates_draft (
  id              uuid primary key default gen_random_uuid(),
  -- Metadata visible en el catalogo
  title           text not null default 'Sin título',
  category        text not null default 'Otros',
  audience        text[] not null default array[]::text[],   -- ['academias','productoras'...]
  internal_tags   text[] not null default array[]::text[],   -- ['wip','revision'...]
  premium         boolean not null default false,
  -- Estado del flujo admin
  status          text not null default 'draft',             -- 'draft' | 'ready' | 'archived'
  -- Estructura del flyer (Fabric.js serializado de la plantilla)
  -- Guardamos las variantes completas (formato + dimensiones + capas)
  variants        jsonb not null default '[]'::jsonb,
  -- Thumbnail opcional para el catalogo admin
  thumbnail_url   text,
  -- Autoria y timestamps
  created_by      uuid not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Indice para listar drafts por usuario rapido
create index if not exists templates_draft_created_by_idx on templates_draft (created_by, updated_at desc);
create index if not exists templates_draft_status_idx on templates_draft (status);

-- ─── 2. Tabla de publicadas (visible al usuario final) ──────────────────
create table if not exists templates_published (
  id              uuid primary key default gen_random_uuid(),
  -- Mismo schema que draft + relacion con el draft origen (opcional)
  draft_id        uuid references templates_draft(id) on delete set null,
  title           text not null,
  category        text not null,
  audience        text[] not null default array[]::text[],
  internal_tags   text[] not null default array[]::text[],
  premium         boolean not null default false,
  variants        jsonb not null,
  thumbnail_url   text,
  published_by    uuid not null references auth.users(id) on delete restrict,
  published_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists templates_published_published_at_idx on templates_published (published_at desc);
create index if not exists templates_published_category_idx on templates_published (category);

-- ─── 3. RLS (Row Level Security) ────────────────────────────────────────
-- Solo admins pueden escribir. La logica admin es a nivel API endpoint
-- (verificamos email contra lib/admin.ts) - aqui solo bloqueamos lectura
-- publica de los drafts y aseguramos que el insert es de un user autenticado.

alter table templates_draft enable row level security;
alter table templates_published enable row level security;

-- DRAFTS: solo el creator puede leer/editar sus propios drafts
drop policy if exists "drafts_select_own" on templates_draft;
create policy "drafts_select_own"
  on templates_draft for select
  using (auth.uid() = created_by);

drop policy if exists "drafts_insert_own" on templates_draft;
create policy "drafts_insert_own"
  on templates_draft for insert
  with check (auth.uid() = created_by);

drop policy if exists "drafts_update_own" on templates_draft;
create policy "drafts_update_own"
  on templates_draft for update
  using (auth.uid() = created_by);

drop policy if exists "drafts_delete_own" on templates_draft;
create policy "drafts_delete_own"
  on templates_draft for delete
  using (auth.uid() = created_by);

-- PUBLISHED: cualquier user puede leer (el catalogo es publico).
-- Solo el publisher puede borrar/actualizar.
drop policy if exists "published_select_all" on templates_published;
create policy "published_select_all"
  on templates_published for select
  using (true);

drop policy if exists "published_insert_authed" on templates_published;
create policy "published_insert_authed"
  on templates_published for insert
  with check (auth.uid() = published_by);

drop policy if exists "published_update_own" on templates_published;
create policy "published_update_own"
  on templates_published for update
  using (auth.uid() = published_by);

drop policy if exists "published_delete_own" on templates_published;
create policy "published_delete_own"
  on templates_published for delete
  using (auth.uid() = published_by);

-- ─── 4. Trigger updated_at automatico ───────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists templates_draft_set_updated_at on templates_draft;
create trigger templates_draft_set_updated_at
  before update on templates_draft
  for each row execute function set_updated_at();

drop trigger if exists templates_published_set_updated_at on templates_published;
create trigger templates_published_set_updated_at
  before update on templates_published
  for each row execute function set_updated_at();
