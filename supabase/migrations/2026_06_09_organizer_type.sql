-- Migration: añadir tipo de organizador al perfil
--
-- El objetivo es saber qué tipo de usuario está usando el producto para
-- entender la audiencia real y priorizar features. Se pregunta una vez
-- tras el primer login con un modal opcional.
--
-- Ejecutar manualmente en el SQL editor de Supabase Dashboard.

-- 1) Tipo enumerado para validar valores (más limpio que TEXT libre)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'organizer_type') then
    create type organizer_type as enum (
      'academia',        -- Academia / Escuela de baile / artes
      'productora',      -- Productora de eventos / promotor
      'freelance',       -- DJ / artista / fotógrafo / diseñador independiente
      'institucion',     -- Centro cultural / ayuntamiento / institución pública
      'agencia',         -- Agencia de marketing / comunicación
      'colegio',         -- Colegio / instituto / educación reglada
      'otro',            -- Otro / no aplica / prefiere no decir
      'skipped'          -- El usuario cerró el modal sin responder
    );
  end if;
end$$;

-- 2) Añadir columna a profiles (nullable — usuarios viejos no la tienen)
alter table public.profiles
  add column if not exists organizer_type organizer_type;

-- 3) Timestamp de cuándo respondió (útil para distinguir "no respondió aún"
--    de "respondió hace tiempo" — el dashboard del admin lo usará)
alter table public.profiles
  add column if not exists organizer_type_answered_at timestamptz;

-- 4) Index ligero para que el admin pueda agrupar por tipo en analytics
create index if not exists profiles_organizer_type_idx
  on public.profiles(organizer_type)
  where organizer_type is not null;

-- 5) RLS: el usuario puede leer y actualizar SU propio organizer_type.
--    El admin (vía service_role) tiene acceso completo para reportes.
--    Asumo que la policy de update sobre profiles ya existe para self;
--    si no, descomentar el bloque siguiente.
--
-- create policy "users update own organizer_type"
--   on public.profiles for update
--   using (auth.uid() = id)
--   with check (auth.uid() = id);

comment on column public.profiles.organizer_type is
  'Tipo de organizador del usuario. Se rellena vía modal post-registro.';
comment on column public.profiles.organizer_type_answered_at is
  'Cuándo respondió el usuario al modal. NULL = aún no preguntado.';
