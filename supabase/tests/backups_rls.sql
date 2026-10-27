begin;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'backup-a@example.test', '{"full_name":"Backup A"}'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'backup-b@example.test', '{"full_name":"Backup B"}');

insert into public.backup_preferences (user_id, automatic_enabled, retention_days)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', true, 30),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', false, 7);

insert into public.backups (user_id, storage_key, file_name, size_bytes, checksum)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee/a.json.gz', 'a.json.gz', 10, 'checksum-a'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'ffffffff-ffff-4fff-8fff-ffffffffffff/b.json.gz', 'b.json.gz', 10, 'checksum-b');

insert into public.change_log (user_id, entity_type, record_id, operation, new_values)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'tasks', '11111111-1111-4111-8111-111111111111', 'INSERT', '{"title":"A"}'),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'tasks', '22222222-2222-4222-8222-222222222222', 'INSERT', '{"title":"B"}');

insert into public.sync_history (user_id, sync_type, status, details, completed_at)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'backup', 'success', '{"file_name":"a.json.gz"}', now()),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'backup', 'success', '{"file_name":"b.json.gz"}', now());

do $$
declare
  v_table text;
  v_policy_count integer;
begin
  foreach v_table in array array['backup_preferences', 'backups', 'change_log', 'sync_history'] loop
    if (select relrowsecurity from pg_class where oid = format('public.%I', v_table)::regclass) is distinct from true then
      raise exception 'FAIL: RLS is not enabled on public.%', v_table;
    end if;
  end loop;

  if not exists (select 1 from storage.buckets where id = 'user-backups' and public = false) then
    raise exception 'FAIL: private user-backups bucket is missing';
  end if;

  select count(*) into v_policy_count
  from pg_policies
  where schemaname = 'storage' and tablename = 'objects'
    and policyname = 'user_backups_read_own'
    and roles @> array['authenticated']::name[];
  if v_policy_count <> 1 then
    raise exception 'FAIL: user-backups storage read policy is missing';
  end if;
  raise notice 'OK: backup tables have RLS and the private bucket policy exists';
end $$;

select set_config('request.jwt.claims', '{"sub":"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.backup_preferences) <> 1
    or (select count(*) from public.backups) <> 1
    or (select count(*) from public.change_log) <> 1
    or (select count(*) from public.sync_history) <> 1 then
    raise exception 'FAIL: user A does not see exactly its own backup data';
  end if;

  begin
    insert into public.backups (user_id, storage_key, file_name, size_bytes, checksum)
    values (auth.uid(), auth.uid()::text || '/forbidden.json.gz', 'forbidden.json.gz', 1, 'x');
    raise exception 'FAIL: client can write backup metadata directly';
  exception when insufficient_privilege then
    null;
  end;
  raise notice 'OK: user A sees only its own rows and cannot create backup metadata directly';
end $$;

reset role;
select set_config('request.jwt.claims', '{"sub":"ffffffff-ffff-4fff-8fff-ffffffffffff","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  if (select count(*) from public.backup_preferences) <> 1
    or (select count(*) from public.backups) <> 1
    or (select count(*) from public.change_log) <> 1
    or (select count(*) from public.sync_history) <> 1 then
    raise exception 'FAIL: user B can access another user backup data';
  end if;
  raise notice 'OK: user B sees only its own backup data';
end $$;

reset role;
select 'OK: backup RLS isolation tests passed' as resultado;
rollback;
