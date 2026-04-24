-- =====================================================================
-- SHformacions — Setup Sync admin (Entrega 3.5)
-- =====================================================================
-- L'admin treballa en local amb Dexie: usuaris, cursos, pagaments, requests,
-- notifications, settings. Aquest schema afegeix **rèpliques al núvol** de
-- les taules que tenen sentit compartir entre dispositius.
--
-- No substitueix les taules de l'Entrega 1 (profiles, budgets, user_courses,
-- diplomas) — les complementa amb entitats que viuen al costat admin.
--
-- Idempotent.
--
-- Model de dades:
--   · public.admin_courses     → cursos del catàleg (sincronitzables)
--   · public.admin_requests    → sol·licituds (opcional — TODO futur)
--   · public.admin_payments    → pagaments (opcional — TODO futur)
--
-- Totes aquestes taules són només accessibles via service_role des d'Edge
-- Functions; la RLS les bloqueja per al client.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- TAULA: admin_courses — rèplica del catàleg de cursos Dexie
-- =====================================================================
create table if not exists public.admin_courses (
  id           uuid primary key default gen_random_uuid(),
  local_id     integer not null,                -- id Dexie original
  name         text not null,
  description  text not null default '',
  category     text not null,
  level        text not null,
  format       text not null,
  duration     numeric not null default 0,
  price        numeric not null default 0,
  max_students integer not null default 0,
  current_students integer not null default 0,
  instructor   text,
  location     text,
  start_date   timestamptz,
  end_date     timestamptz,
  status       text not null default 'active',
  tags         text,
  objectives   text,
  target_audience text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  synced_at    timestamptz not null default now(),
  unique (local_id)
);

create index if not exists admin_courses_local_id_idx on public.admin_courses (local_id);
create index if not exists admin_courses_category_idx on public.admin_courses (category);
create index if not exists admin_courses_status_idx on public.admin_courses (status);

-- Trigger updated_at
create or replace function public.admin_courses_set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists admin_courses_touch_updated_at on public.admin_courses;
create trigger admin_courses_touch_updated_at
  before update on public.admin_courses
  for each row execute function public.admin_courses_set_updated_at();

-- RLS: només service_role (cap client no pot llegir/escriure)
alter table public.admin_courses enable row level security;

drop policy if exists "admin_courses_deny_all" on public.admin_courses;
create policy "admin_courses_deny_all"
  on public.admin_courses
  for all
  using (false)
  with check (false);

-- =====================================================================
-- TAULA: admin_sync_log — registre d'operacions de sync
-- =====================================================================
create table if not exists public.admin_sync_log (
  id          uuid primary key default gen_random_uuid(),
  operation   text not null check (operation in ('push', 'pull')),
  entity      text not null,       -- 'courses', 'users', 'payments', ...
  items_count integer not null default 0,
  device_id   text,                -- identificador opcional del dispositiu
  created_at  timestamptz not null default now()
);

create index if not exists admin_sync_log_created_at_idx
  on public.admin_sync_log (created_at desc);

alter table public.admin_sync_log enable row level security;

drop policy if exists "admin_sync_log_deny_all" on public.admin_sync_log;
create policy "admin_sync_log_deny_all"
  on public.admin_sync_log
  for all
  using (false)
  with check (false);

comment on table public.admin_sync_log is
  'Registre d''operacions de sincronització entre Dexie local i Supabase, només escrit per l''Edge Function admin-sync.';
