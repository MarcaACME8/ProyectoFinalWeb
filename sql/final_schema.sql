-- SQL final para Supabase: tablas, triggers, RLS y políticas Storage

-- Tabla profiles
create table if not exists public.profiles (
  id uuid primary key,
  nombre text,
  email text unique,
  rol text default 'usuario',
  created_at timestamptz default now()
);

-- Tabla incidents
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.profiles(id) on delete cascade,
  tipo text,
  descripcion text,
  imagen_url text,
  ubicacion_texto text,
  latitud double precision,
  longitud double precision,
  estado text default 'reportado',
  grupo_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Función trigger para sincronizar auth.users con profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.profiles (id, email, nombre, rol)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'nombre', new.email),
      coalesce(new.raw_user_meta_data->>'role', 'usuario')
    )
    on conflict (id) do nothing;
    return new;
  elsif (tg_op = 'UPDATE') then
    update public.profiles set email = new.email where id = new.id;
    return new;
  end if;
  return null;
end;
$$;

create trigger on_auth_user_change
after insert or update on auth.users
for each row
execute procedure public.handle_new_user();

-- Habilitar RLS
alter table public.profiles enable row level security;
alter table public.incidents enable row level security;

-- Policies profiles
create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
for select using (exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'));

create policy "profiles_insert" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

-- Policies incidents
create policy "incidents_select_user" on public.incidents
for select using (usuario_id = auth.uid());

create policy "incidents_select_admin" on public.incidents
for select using (exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'));

create policy "incidents_insert" on public.incidents
for insert with check (usuario_id = auth.uid());

create policy "incidents_update_user" on public.incidents
for update using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy "incidents_update_admin" on public.incidents
for update using (exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'));

-- Storage policies ejemplo para bucket 'reports'
create policy "reports_insert_authenticated" on storage.objects
for insert with check (
  auth.role() = 'authenticated' and
  bucket_id = 'reports' and
  ( lower(coalesce(metadata->>'content-type','')) like '%png%' or lower(coalesce(metadata->>'content-type','')) like '%jpeg%' or lower(coalesce(metadata->>'content-type','')) like '%webp%')
);

create policy "reports_select_public" on storage.objects
for select using (bucket_id = 'reports');

create policy "reports_delete_owner_or_admin" on storage.objects
for delete using (
  bucket_id = 'reports' and (
    (metadata->>'owner') = auth.uid() or exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin')
  )
);

create policy "reports_update_owner_or_admin" on storage.objects
for update using (
  bucket_id = 'reports' and (
    (metadata->>'owner') = auth.uid() or exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin')
  )
);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_incident_updated_at
before update on public.incidents
for each row
execute procedure public.set_updated_at();
