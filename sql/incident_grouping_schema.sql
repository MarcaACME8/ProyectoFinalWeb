-- SQL de agrupación de incidentes para la app.

-- 1) Tabla de grupos de incidentes
create table if not exists public.incident_groups (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  status text not null default 'reportado',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_incident_groupss_status on public.incident_groups (status);
create index if not exists idx_incident_groupss_created_at on public.incident_groups (created_at desc);

-- 2) Migrar la columna grupo_id de incidents a clave foránea
alter table public.incidents
  add constraint fk_incidents_incident_groupss
  foreign key (grupo_id) references public.incident_groups(id) on delete set null;

-- 3) Trigger de timestamps para incident_groups
create or replace function public.set_incident_groups_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_incident_groups_updated_at
before update on public.incident_groups
for each row
execute procedure public.set_incident_groups_updated_at();

-- 4) Función para crear un grupo y asociar incidentes
create or replace function public.create_incident_groups_with_incidents(
  _title text,
  _description text,
  _status text,
  _incident_ids uuid[]
)
returns public.incident_groups
language plpgsql
security definer
as $$
declare
  new_group_id uuid;
begin
  insert into public.incident_groups (title, description, status)
  values (_title, _description, _status)
  returning id into new_group_id;

  update public.incidents
  set grupo_id = new_group_id
  where id = any(_incident_ids);

  return query select * from public.incident_groups where id = new_group_id;
end;
$$;

-- 5) Función para actualizar el estado del grupo y sincronizar incidentes asociados
create or replace function public.update_incident_groups_status(
  _group_id uuid,
  _status text
)
returns public.incident_groups
language plpgsql
security definer
as $$
declare
  updated_group public.incident_groups%rowtype;
begin
  update public.incident_groups
  set status = _status
  where id = _group_id
  returning * into updated_group;

  update public.incidents
  set estado = _status
  where grupo_id = _group_id;

  return updated_group;
end;
$$;

-- 6) Trigger para notificar cuando cambia el estado de un grupo
create or replace function public.handle_group_status_change()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, title, message, type, metadata)
    select
      i.usuario_id,
      format('Estado de grupo actualizado: %s', coalesce(new.title, 'Grupo sin nombre')),
      format('El grupo de incidentes "%s" cambió a %s. Tu incidente se actualizó automáticamente.', coalesce(new.title, 'Grupo sin nombre'), new.status),
      'group_created',
      jsonb_build_object('group_id', new.id, 'from_status', old.status, 'to_status', new.status)
    from public.incidents i
    where i.grupo_id = new.id
      and i.usuario_id is not null;
  end if;

  return new;
end;
$$;

create trigger notify_users_on_group_status_change
after update on public.incident_groups
for each row
when (old.status is distinct from new.status)
execute procedure public.handle_group_status_change();

-- 7) RLS y políticas para incident_groups
alter table public.incident_groups enable row level security;

create policy "incident_groupss_select_admin" on public.incident_groups
for select using (
  exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin')
);

create policy "incident_groupss_select_user" on public.incident_groups
for select using (
  exists (
    select 1 from public.incidents
    where public.incidents.grupo_id = public.incident_groups.id
      and public.incidents.usuario_id = auth.uid()
  )
);

create policy "incident_groupss_insert_admin" on public.incident_groups
for insert with check (
  exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin')
);

create policy "incident_groupss_update_admin" on public.incident_groups
for update using (
  exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin')
) with check (
  exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin')
);

-- 8) Opcional: política de eliminación si quieres permitir solo admin
create policy "incident_groupss_delete_admin" on public.incident_groups
for delete using (
  exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin')
);
