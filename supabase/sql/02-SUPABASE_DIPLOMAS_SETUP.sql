-- =====================================================================
-- SHformacions — Setup Storage bucket per diplomes (Entrega 3.4)
-- =====================================================================
-- Executa aquest script a l'SQL Editor de Supabase després del
-- SUPABASE_SETUP.sql de l'Entrega 1 (cal que la taula `diplomas` existeixi).
--
-- Idempotent: es pot re-executar.
--
-- Crea un bucket "diplomas" privat amb polítiques:
--   · Lectura: cada usuari només veu els seus propis PDFs
--             (el path del fitxer comença amb el seu user_id)
--   · Escriptura: NOMÉS service_role (l'Edge Function issue-diploma)
-- =====================================================================

-- 1. Crear el bucket (privat)
insert into storage.buckets (id, name, public)
values ('diplomas', 'diplomas', false)
on conflict (id) do nothing;

-- 2. Polítiques RLS al bucket
-- Esborra les antigues si existeixen, per poder re-executar
drop policy if exists "diplomas_read_own" on storage.objects;
drop policy if exists "diplomas_insert_service_role" on storage.objects;
drop policy if exists "diplomas_update_service_role" on storage.objects;
drop policy if exists "diplomas_delete_service_role" on storage.objects;

-- Cada usuari pot llegir els seus propis PDFs.
-- Convenció: el path és "<user_id>/<verification_code>.pdf"
create policy "diplomas_read_own"
  on storage.objects for select
  using (
    bucket_id = 'diplomas'
    and (
      -- l'usuari autenticat és el propietari (primer segment del path)
      auth.uid()::text = (storage.foldername(name))[1]
      -- o bé és una crida pública (per verificació per codi)
      -- [desactivat per defecte — obrir només si volem verificació pública]
    )
  );

-- Només la service_role pot inserir/modificar/eliminar.
-- Les Edge Functions amb service_role bypassen RLS de totes maneres,
-- però deixem la política explícita per claredat.
create policy "diplomas_insert_service_role"
  on storage.objects for insert
  with check (bucket_id = 'diplomas' and auth.role() = 'service_role');

create policy "diplomas_update_service_role"
  on storage.objects for update
  using (bucket_id = 'diplomas' and auth.role() = 'service_role');

create policy "diplomas_delete_service_role"
  on storage.objects for delete
  using (bucket_id = 'diplomas' and auth.role() = 'service_role');

-- 3. Assegurar que la taula diplomas té la columna pdf_url, verification_code, student_name, hours
-- (Si ja les tens per l'Entrega 1, els `add column if not exists` seran no-ops).
alter table public.diplomas
  add column if not exists student_name text,
  add column if not exists hours numeric,
  add column if not exists issued_by text,
  add column if not exists pdf_url text,
  add column if not exists verification_code text unique;

-- Índex per buscar ràpid per codi de verificació
create index if not exists diplomas_verification_code_idx
  on public.diplomas (verification_code);

-- 4. VERIFICACIÓ PÚBLICA — via RPC function (evita filtracions amb SELECT lliure)
--
-- Creem una funció SQL que retorna un diploma només si es coneix el codi exacte.
-- Aquesta funció és la ÚNICA manera de verificar diplomes sense ser el propietari.
-- El client ha de cridar-la amb `.rpc('verify_diploma_by_code', { code: '...' })`.

create or replace function public.verify_diploma_by_code(code text)
returns table (
  id uuid,
  course_key text,
  course_name text,
  student_name text,
  hours numeric,
  issued_at timestamptz,
  issued_by text,
  verification_code text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    d.id,
    d.course_key,
    d.course_name,
    d.student_name,
    d.hours,
    d.issued_at,
    d.issued_by,
    d.verification_code
  from public.diplomas d
  where d.verification_code = code
    and d.verification_code is not null
  limit 1;
$$;

revoke all on function public.verify_diploma_by_code(text) from public;
grant execute on function public.verify_diploma_by_code(text) to anon, authenticated;

comment on function public.verify_diploma_by_code is
  'Verifica un diploma pel codi de verificació. Retorna 0 o 1 fila. SECURITY DEFINER permet saltar-se la RLS i retornar només els camps necessaris.';

-- No creem policy pública a diplomas per evitar filtracions.
-- La verificació pública es fa exclusivament via la funció RPC.
drop policy if exists "diplomas_public_verify" on public.diplomas;
