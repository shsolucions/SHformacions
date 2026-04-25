-- =====================================================================
-- SHformacions — Supabase setup (Entrega 1)
-- =====================================================================
-- Executa aquest script sencer a l'SQL Editor de Supabase (un cop).
-- Idempotent: es pot re-executar sense perdre dades.
--
-- Model d'auth:
--   · Usuaris normals → auth.users (email + password via supabase.auth.signUp)
--   · Admin          → NO viu a auth.users. Login hardcoded a l'app amb
--                      credencials 'admin' / '123456'. Les seves accions al
--                      núvol s'executen amb service_role (via Edge
--                      Functions, mai al client) o queden en local.
--
-- Taules principals:
--   · profiles      → 1-a-1 amb auth.users (nom, nickname, email)
--   · user_courses  → inscripcions a cursos per usuari
--   · budgets       → pressuposts generats per l'usuari
--   · diplomas      → diplomes emesos a l'usuari
-- =====================================================================

-- ---------- EXTENSIONS ------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------- PROFILES --------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text unique not null,
  name       text not null,
  email      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil públic d''un usuari autenticat (1-a-1 amb auth.users).';

create index if not exists profiles_nickname_idx on public.profiles (nickname);

-- ---------- BUDGETS ---------------------------------------------------
create table if not exists public.budgets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null default 'Pressupost',
  items      jsonb not null default '[]'::jsonb,
  total      numeric not null default 0,
  currency   text not null default 'EUR',
  status     text not null default 'draft'
    check (status in ('draft','sent','accepted','rejected')),
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists budgets_user_id_idx on public.budgets (user_id);
create index if not exists budgets_status_idx  on public.budgets (status);

-- ---------- USER_COURSES ---------------------------------------------
create table if not exists public.user_courses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  course_key   text not null,     -- clau tècnica (p. ex. 'excel-basic')
  course_name  text not null,
  status       text not null default 'interested'
    check (status in ('interested','enrolled','completed','cancelled')),
  progress     integer not null default 0 check (progress between 0 and 100),
  enrolled_at  timestamptz,
  completed_at timestamptz,
  metadata     jsonb default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, course_key)
);

create index if not exists user_courses_user_id_idx on public.user_courses (user_id);
create index if not exists user_courses_status_idx  on public.user_courses (status);

-- ---------- DIPLOMAS --------------------------------------------------
create table if not exists public.diplomas (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  course_key         text not null,
  course_name        text not null,
  issued_at          timestamptz not null default now(),
  pdf_url            text,
  verification_code  text unique,
  issued_by          text,
  created_at         timestamptz not null default now()
);

create index if not exists diplomas_user_id_idx on public.diplomas (user_id);
create index if not exists diplomas_verification_code_idx
  on public.diplomas (verification_code);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================

alter table public.profiles     enable row level security;
alter table public.budgets      enable row level security;
alter table public.user_courses enable row level security;
alter table public.diplomas     enable row level security;

-- Esborra polítiques antigues per poder re-executar
drop policy if exists "profiles_select_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;

drop policy if exists "budgets_all_self" on public.budgets;

drop policy if exists "user_courses_all_self" on public.user_courses;

drop policy if exists "diplomas_select_self" on public.diplomas;

-- profiles: cada usuari pot llegir i modificar el seu perfil
create policy "profiles_select_self"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- budgets: operacions només sobre els propis (CRUD complet)
create policy "budgets_all_self"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- user_courses: idem
create policy "user_courses_all_self"
  on public.user_courses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- diplomas: l'usuari NO pot crear/modificar/eliminar (només SELECT).
-- L'emissió i revocació van via service_role (Edge Function).
create policy "diplomas_select_self"
  on public.diplomas for select
  using (auth.uid() = user_id);

-- =====================================================================
-- TRIGGERS
-- =====================================================================

-- Funció genèrica updated_at
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists budgets_touch_updated_at on public.budgets;
create trigger budgets_touch_updated_at
  before update on public.budgets
  for each row execute function public.touch_updated_at();

drop trigger if exists user_courses_touch_updated_at on public.user_courses;
create trigger user_courses_touch_updated_at
  before update on public.user_courses
  for each row execute function public.touch_updated_at();

-- Funció que crea el perfil quan es registra un nou auth.user
-- Llegeix les metadades passades a supabase.auth.signUp(options: { data: {...} })
create or replace function public.handle_new_user()
returns trigger as $$
declare
  nick text;
  nm   text;
begin
  nick := coalesce(
    new.raw_user_meta_data->>'nickname',
    split_part(new.email, '@', 1)
  );
  nm := coalesce(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    nick
  );

  -- Evita col·lisió de nickname afegint-hi un sufix numèric si cal
  if exists (select 1 from public.profiles where nickname = nick) then
    nick := nick || '-' || substring(new.id::text, 1, 4);
  end if;

  insert into public.profiles (id, nickname, name, email)
  values (new.id, nick, nm, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- FUNCIONS PÚBLIQUES (security definer — bypass RLS controlat)
-- =====================================================================

-- Necessària per al login cross-device: el client crida aquesta funció
-- ABANS d'autenticar-se, per resoldre el nickname → email.
-- Retorna null si el nickname no existeix.
create or replace function public.get_email_by_nickname(p_nickname text)
returns text
language sql security definer stable
set search_path = public
as $$
  select email
  from public.profiles
  where lower(nickname) = lower(p_nickname)
  limit 1;
$$;

-- Permet que qualsevol cridi la funció (inclòs usuari anònim)
grant execute on function public.get_email_by_nickname(text) to anon, authenticated;

-- =====================================================================
-- FI DE L'SCRIPT
-- =====================================================================
