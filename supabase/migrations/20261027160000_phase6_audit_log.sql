create table public.audit_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null,
  record_id uuid not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  changed_fields text[] not null default '{}',
  occurred_at timestamptz not null default now()
);

create index audit_log_user_occurred_idx on public.audit_log (user_id, occurred_at desc);

alter table public.audit_log enable row level security;
create policy audit_log_select_own on public.audit_log
  for select to authenticated using ((select auth.uid()) = user_id);

grant select on public.audit_log to authenticated;
revoke insert, update, delete on public.audit_log from anon, authenticated;
revoke all on public.audit_log from anon;
revoke all on public.audit_log from public;

create or replace function public.capture_audit_log_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_row jsonb := '{}'::jsonb;
  new_row jsonb := '{}'::jsonb;
  source_row jsonb;
  owner_id uuid;
  record_uuid uuid;
  changed_fields text[];
begin
  if tg_op in ('UPDATE', 'DELETE') then old_row := pg_catalog.to_jsonb(old); end if;
  if tg_op in ('INSERT', 'UPDATE') then new_row := pg_catalog.to_jsonb(new); end if;

  source_row := case when tg_op = 'INSERT' then new_row else old_row end;
  owner_id := coalesce(source_row ->> 'user_id', source_row ->> 'owner_id');
  if owner_id is null and tg_table_name = 'profiles' then owner_id := source_row ->> 'id'; end if;
  record_uuid := source_row ->> 'id';

  if owner_id is null or record_uuid is null then
    raise exception 'Cannot audit %.% without a record owner and UUID', tg_table_name, tg_op;
  end if;

  -- Account deletion cascades into owned tables while the auth.users row may
  -- still be visible to this transaction. Do not create audit rows for those
  -- cascaded deletes: their user_id is being removed by the same operation.
  if tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() > 1 then
    return old;
  end if;

  -- Rows deleted as part of account removal have no remaining auth.users owner.
  -- Skip their audit entry so cascading account deletion can complete cleanly.
  if not exists (select 1 from auth.users where id = owner_id::uuid) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  select coalesce(pg_catalog.array_agg(keys.key order by keys.key), array[]::text[])
  into changed_fields
  from pg_catalog.jsonb_object_keys(case when tg_op = 'DELETE' then old_row else new_row end) as keys(key)
  where keys.key not in ('id', 'user_id', 'owner_id', 'created_at', 'updated_at', 'share_token')
    and (tg_op <> 'UPDATE' or (old_row -> keys.key) is distinct from (new_row -> keys.key));

  insert into public.audit_log (user_id, entity_type, record_id, operation, changed_fields)
  values (owner_id::uuid, tg_table_name, record_uuid::uuid, tg_op, changed_fields);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.capture_audit_log_entry() from public, anon, authenticated;

create trigger phase6_audit_profiles after insert or update or delete on public.profiles
  for each row execute function public.capture_audit_log_entry();
create trigger phase6_audit_tasks after insert or update or delete on public.tasks
  for each row execute function public.capture_audit_log_entry();
create trigger phase6_audit_notes after insert or update or delete on public.notes
  for each row execute function public.capture_audit_log_entry();
create trigger phase6_audit_events after insert or update or delete on public.events
  for each row execute function public.capture_audit_log_entry();
create trigger phase6_audit_files after insert or update or delete on public.stored_files
  for each row execute function public.capture_audit_log_entry();
create trigger phase6_audit_categories after insert or update or delete on public.categories
  for each row execute function public.capture_audit_log_entry();
create trigger phase6_audit_code_categories after insert or update or delete on public.programming_categories
  for each row execute function public.capture_audit_log_entry();
create trigger phase6_audit_tags after insert or update or delete on public.tags
  for each row execute function public.capture_audit_log_entry();
create trigger phase6_audit_note_shares after insert or update or delete on public.note_shares
  for each row execute function public.capture_audit_log_entry();
create trigger phase6_audit_event_shares after insert or update or delete on public.event_shares
  for each row execute function public.capture_audit_log_entry();
