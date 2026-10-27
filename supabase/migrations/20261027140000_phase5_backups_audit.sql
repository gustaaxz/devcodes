create table public.backup_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  automatic_enabled boolean not null default false,
  retention_days integer not null default 30 check (retention_days between 7 and 365),
  updated_at timestamptz not null default now()
);

create table public.backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_key text not null unique,
  file_name text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  checksum text not null,
  status text not null default 'ready' check (status in ('ready', 'failed')),
  created_at timestamptz not null default now()
);
create index backups_user_created_idx on public.backups (user_id, created_at desc);

create table public.change_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null,
  record_id uuid not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  old_values jsonb,
  new_values jsonb,
  occurred_at timestamptz not null default now()
);
create index change_log_user_occurred_idx on public.change_log (user_id, occurred_at desc);

create table public.sync_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sync_type text not null,
  status text not null check (status in ('running', 'success', 'partial', 'error')),
  details jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index sync_history_user_started_idx on public.sync_history (user_id, started_at desc);

alter table public.backup_preferences enable row level security;
alter table public.backups enable row level security;
alter table public.change_log enable row level security;
alter table public.sync_history enable row level security;

create policy backup_preferences_own on public.backup_preferences
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy backups_select_own on public.backups
  for select to authenticated using ((select auth.uid()) = user_id);
create policy change_log_select_own on public.change_log
  for select to authenticated using ((select auth.uid()) = user_id);
create policy sync_history_select_own on public.sync_history
  for select to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.backup_preferences to authenticated;
grant select on public.backups, public.change_log, public.sync_history to authenticated;
grant all on public.backups, public.backup_preferences, public.change_log, public.sync_history to service_role;
grant usage, select on sequence public.change_log_id_seq to service_role;

insert into storage.buckets (id, name, public, file_size_limit)
values ('user-backups', 'user-backups', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;
create policy user_backups_read_own on storage.objects
  for select to authenticated
  using (bucket_id = 'user-backups' and (storage.foldername(name))[1] = (select auth.uid())::text);

create trigger backup_preferences_set_updated_at before update on public.backup_preferences
  for each row execute function public.set_updated_at();

create or replace function public.capture_change_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb;
  owner_id uuid;
  record_uuid uuid;
begin
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  owner_id := (row_data ->> 'user_id')::uuid;
  record_uuid := (row_data ->> 'id')::uuid;
  if owner_id is null or record_uuid is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  insert into public.change_log (user_id, entity_type, record_id, operation, old_values, new_values)
  values (
    owner_id,
    tg_table_name,
    record_uuid,
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.capture_change_log() from public, anon, authenticated;

create trigger tasks_capture_change after insert or update or delete on public.tasks
  for each row execute function public.capture_change_log();
create trigger notes_capture_change after insert or update or delete on public.notes
  for each row execute function public.capture_change_log();
create trigger events_capture_change after insert or update or delete on public.events
  for each row execute function public.capture_change_log();
create trigger stored_files_capture_change after insert or update or delete on public.stored_files
  for each row execute function public.capture_change_log();
