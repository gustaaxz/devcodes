-- Skip audit inserts while auth.users deletion cascades through owned tables.
-- The parent row can remain visible to the transaction snapshot until the
-- cascading statement finishes, so checking auth.users alone is insufficient.
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

  if tg_op = 'DELETE' and pg_catalog.pg_trigger_depth() > 1 then
    return old;
  end if;

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
